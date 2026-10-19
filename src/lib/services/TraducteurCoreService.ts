import { computed, inject, Service, Signal, TransferState, signal, makeStateKey, PLATFORM_ID } from "@angular/core";
import { DOCUMENT, isPlatformServer } from "@angular/common";
import { MISSING_TRANSLATION_HANDLER, TRANSLATION_CONFIG, TranslationDictionary } from "../tokens/translation";
import { TranslationStorageService } from "./translationStorageService";
import { deepMerge } from "../utils/deep-merge";
import { resolveKey } from "../utils/key-resolver";
import { DefaultMissingHandler } from "../handlers/default-missing-handler";
import { interpolate } from "../utils/interpolator";
import { filter, firstValueFrom } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { NavigationEnd, Router } from "@angular/router";
import { ExtractParams, TranslationKey } from "../tokens/auto-complete-key";

@Service()
export class TraducteurCoreService
{
    langueActuelle = signal<string>("");

    // permet de savoir si on doit changer le sens d'ecriture sur certaine langue
    sensEcriture = computed<'ltr' | 'rtl'>(() => ['ar', 'he', 'fa', 'ur'].includes(this.langueActuelle()) ? 'rtl' : 'ltr');

    private TRANSLATION_CONFIG = inject(TRANSLATION_CONFIG, { optional: true });
    private MISSING_TRANSLATION_HANDLER = inject(MISSING_TRANSLATION_HANDLER, { optional: true }) ?? new DefaultMissingHandler();
    private idPlateforme = inject(PLATFORM_ID);
    private translationStorageServ = inject(TranslationStorageService);
    private document = inject(DOCUMENT);
    private http = inject(HttpClient);
    private router = inject(Router, { optional: true });
    private transferState = inject(TransferState);

    private cache = new Map<string, TranslationDictionary>();
    private traduction = signal<TranslationDictionary>({});
    private activeScopes = new Map<string, string>();

    async init(): Promise<void>
    {
        const initLang = this.resolveInitialLanguage();
        await this.use(initLang);

        // Préchargement de la chaîne de fallback
        const fallbacks = this.getFallbackArray();
        for (const fallback of fallbacks)
        {
            if (fallback != initLang)
                this.loadLangue(fallback);
        }

        this.listenToUrlChanges();
    }

    async loadLangue(lang: string): Promise<TranslationDictionary>
    {
        if (this.cache.has(lang))
            return this.cache.get(lang)!;

        // 1. SSR OPTIMISATION : On vérifie si le serveur a déjà mis le JSON en cache
        const stateKey = makeStateKey<TranslationDictionary>(`translate-${lang}`);
        if (this.transferState.hasKey(stateKey))
        {
            const cachedData = this.transferState.get(stateKey, {});
            this.transferState.remove(stateKey); // On nettoie pour libérer la mémoire
            this.cache.set(lang, cachedData);
            return cachedData;
        }

        const sources = this.TRANSLATION_CONFIG?.sources?.length
            ? this.TRANSLATION_CONFIG.sources
            : ['/assets/i18n/'];

        const urls = sources.map(source => `${source}${lang}.json`);

        const results = await Promise.allSettled(
            urls.map(url => firstValueFrom(this.http.get<TranslationDictionary>(url)))
        );

        const dictionaries = results
            .filter((x): x is PromiseFulfilledResult<TranslationDictionary> => x.status === "fulfilled" && x.value != null)
            .map(x => x.value);

        const merged = deepMerge(...dictionaries);
        this.cache.set(lang, merged);

        // 2. SSR OPTIMISATION : Si on est sur le serveur, on injecte le résultat dans le HTML
        if (isPlatformServer(this.idPlateforme))
            this.transferState.set(stateKey, merged);

        return merged;
    }

    /**
     * Preloads a language in the background without applying it.
     * Ideal to call when hovering over a language change button.
     */
    async preload(lang: string): Promise<void>
    {
        try
        {
            await this.loadLangue(lang);
            // Si on utilise des scopes, on précharge aussi les scopes actifs pour cette langue
            for (const [scope, source] of this.activeScopes.entries())
            {
                const url = `${source}${lang}.json`;
                const scopeDict = await firstValueFrom(this.http.get<TranslationDictionary>(url));

                // On fusionne discrètement dans le cache
                const existing = this.cache.get(lang) ?? {};
                this.cache.set(lang, deepMerge(existing, { [scope]: scopeDict }));
            }
        }
        catch (e)
        {
            console.warn(`[Translate] Failed prefetch for language ${lang}`);
        }
    }

    async use(lang: string): Promise<void>
    {
        let dictFinal = await this.loadLangue(lang);

        // Rechargement des scopes actifs pour la nouvelle langue
        for (const [scope, source] of this.activeScopes.entries())
        {
            try
            {
                const url = `${source}${lang}.json`;
                const scopeDict = await firstValueFrom(this.http.get<TranslationDictionary>(url));
                dictFinal = deepMerge(dictFinal, { [scope]: scopeDict });
            }
            catch (e) { }
        }

        this.traduction.set(dictFinal);
        this.cache.set(lang, dictFinal);
        this.langueActuelle.set(lang);
        this.updateDomAttributes(lang, this.sensEcriture());

        if (this.TRANSLATION_CONFIG?.persist ?? true)
            this.translationStorageServ.set("app_lang", lang);
    }

    async loadScope(scope: string, source: string): Promise<void>
    {
        if (this.activeScopes.has(scope))
            return;

        this.activeScopes.set(scope, source);

        const lang = this.langueActuelle();
        const url = `${source}${lang}.json`;

        try
        {
            const dictionary = await firstValueFrom(this.http.get<TranslationDictionary>(url));

            // Encapsulation sous la clé du scope (ex: { "admin": { "TITLE": "..." } })
            const scopedDictionary = { [scope]: dictionary };
            this.setTranslation(lang, scopedDictionary, true);
        }
        catch (e)
        {
            console.warn(`[Translate] Impossible de charger le scope: ${scope}`);
        }
    }

    instant<K extends TranslationKey>(key: K, params?: ExtractParams<K>, fallback?: TranslationKey | string): string
    {
        let texteBrut = resolveKey(this.traduction(), key as string);

        // LOGIQUE DE FALLBACK CHAIN GLOBAL
        if (texteBrut === undefined)
        {
            const fallbacks = this.getFallbackArray();
            for (const fallbackLang of fallbacks)
            {
                const fallbackDict = this.cache.get(fallbackLang);
                texteBrut = resolveKey(fallbackDict, key as string);
                if (texteBrut !== undefined) break;
            }
        }

        // Traitement du Fallback Local
        if (texteBrut === undefined && fallback !== undefined)
        {
            // 1. On tente de résoudre le fallback comme une clé dans la langue actuelle
            let fallbackTexte = resolveKey(this.traduction(), fallback);

            // 2. Si non trouvé, on tente dans les langues de secours globales
            if (fallbackTexte === undefined)
            {
                const fallbacks = this.getFallbackArray();
                for (const fallbackLang of fallbacks)
                {
                    const fallbackDict = this.cache.get(fallbackLang);
                    fallbackTexte = resolveKey(fallbackDict, fallback);
                    if (fallbackTexte !== undefined) 
                        break;
                }
            }

            // 3. Si c'était bien une clé valide, on l'utilise. 
            // Sinon, on considère que le développeur a passé du texte brut.
            texteBrut = fallbackTexte !== undefined ? fallbackTexte : fallback;
        }

        if (texteBrut === undefined)
        {
            return this.MISSING_TRANSLATION_HANDLER.handle({
                key,
                currentLang: this.langueActuelle(),
                params
            });
        }

        const texteTraduit = interpolate(texteBrut, params, this.langueActuelle());
        return texteTraduit ?? key;
    }

    translateSignal<K extends TranslationKey>(key: K, params?: ExtractParams<K>, fallback?: TranslationKey | string): Signal<string>
    {
        return computed(() => this.instant(key, params, fallback));
    }

    setTranslation(lang: string, dictionary: TranslationDictionary, merge = true): void
    {
        const existing = this.cache.get(lang) ?? {};
        const updated = merge ? deepMerge(existing, dictionary) : dictionary;
        this.cache.set(lang, updated);

        if (this.langueActuelle() == lang)
            this.traduction.set(updated);
    }

    private updateDomAttributes(lang: string, direction: 'ltr' | 'rtl'): void
    {
        const root = this.document?.documentElement;
        if (root)
        {
            root.setAttribute("lang", lang);
            root.setAttribute("dir", direction);
        }
    }

    private resolveInitialLanguage(): string
    {
        let urlNomParam = this.TRANSLATION_CONFIG?.urlParam;
        if (urlNomParam && this.document?.defaultView)
        {
            // Récupèrer les paramètres de l'URL
            const urlParams = new URLSearchParams(this.document.defaultView.location.search);
            let langueUrl = urlParams.get(urlNomParam);

            if (langueUrl)
                return langueUrl;
        }

        const pathIndex = this.TRANSLATION_CONFIG?.pathIndex;
        if (pathIndex !== undefined && this.document?.defaultView) 
        {
            const pathSegments = this.document.defaultView.location.pathname.split('/');
            // pathname commence par '/', donc pathSegments[0] est vide. 
            // pathSegments[1] contiendra 'fr'
            const langFromPath = pathSegments[pathIndex];

            // Vérification basique pour s'assurer que c'est bien un code langue (ex: 2 lettres)
            if (langFromPath && langFromPath.length == 2)
                return langFromPath;
        }

        if (this.TRANSLATION_CONFIG?.persist ?? true)
        {
            let langue = this.translationStorageServ.get("app_lang");

            if (langue)
                return langue;
        }

        if (this.TRANSLATION_CONFIG?.autoDetect)
        {
            let langueNav = this.translationStorageServ.getBrowserlang();

            if (langueNav)
                return langueNav;
        }

        return this.TRANSLATION_CONFIG?.defaultLang ?? 'en';
    }

    private listenToUrlChanges(): void
    {
        const urlNomParam = this.TRANSLATION_CONFIG?.urlParam;
        const indexRouteParam = this.TRANSLATION_CONFIG?.pathIndex;

        if (this.router && (urlNomParam || indexRouteParam != undefined))
        {
            this.router.events.pipe(
                filter((event): event is NavigationEnd => event instanceof NavigationEnd)
            ).subscribe((event: NavigationEnd) =>
            {
                let langUrl: string | undefined | null = null;

                // On cherche d'abord dans les paramètres (?lang=fr)
                if (urlNomParam)
                {
                    const urlTree = this.router!.parseUrl(event.urlAfterRedirects);
                    langUrl = urlTree.queryParams[urlNomParam];
                }

                // 2. Sinon, on cherche dans le chemin de l'URL (/fr/...)
                if (!langUrl && indexRouteParam !== undefined)
                {
                    const urlTree = this.router!.parseUrl(event.urlAfterRedirects);

                    // Le premier segment root est souvent vide, donc on décale
                    const segments = urlTree.root.children['primary']?.segments;

                    if (segments && segments.length > indexRouteParam)
                        langUrl = segments[indexRouteParam].path;
                }

                if (langUrl && langUrl.length == 2 && langUrl != this.langueActuelle())
                    this.use(langUrl);
            });
        }
    }

    private getFallbackArray(): string[]
    {
        const fallback = this.TRANSLATION_CONFIG?.fallbackLang;
        if (!fallback)
            return [];

        return Array.isArray(fallback) ? fallback : [fallback];
    }
}