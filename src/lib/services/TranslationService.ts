import { inject, Service, Signal } from "@angular/core";
import { TraducteurCoreService } from "./TraducteurCoreService";
import { ExtractParams, TranslationKey } from "../tokens/auto-complete-key";

@Service()
export class TranslationService
{
    private tradCoreServ = inject(TraducteurCoreService);

    /**
     * A reactive signal containing the currently active language code.
     * @example 'en', 'fr', 'es'
     */
    readonly currentLang = this.tradCoreServ.langueActuelle.asReadonly();

    /**
     * A reactive signal indicating the text direction based on the current language.
     * Returns 'rtl' (Right-to-Left) for languages like Arabic or Hebrew, and 'ltr' (Left-to-Right) for others.
     */
    readonly dir = this.tradCoreServ.sensEcriture;

    /**
     * A reactive signal indicating if a language file is currently being downloaded.
     * Ideal for displaying a loading spinner or disabling the language selector.
     */
    readonly isTranslating = this.tradCoreServ.estEnChargement.asReadonly();

    /**
     * Changes the active language of the application.
     * Automatically fetches the required translation files if they are not already cached.
     * 
     * @param lang The language code to switch to (e.g., 'fr').
     * @returns A promise that resolves when the new language is fully loaded and applied.
     */
    async use(lang: string): Promise<void>
    {
        return this.tradCoreServ.use(lang);
    }

    /**
     * Preloads the translation files for a specific language in the background.
     * Ideal for triggering on mouse hover to ensure instant language switching.
     * 
     * @param lang The language code to preload.
     */
    async preload(lang: string): Promise<void>
    {
        return this.tradCoreServ.preload(lang);
    }

    /**
     * Translates a key synchronously and returns the localized string.
     * 
     * @param key The translation key (e.g. 'HOME.TITLE').
     * @param params An optional object containing variables for string interpolation.
     * @param fallback An optional fallback translation key or raw string to use if the primary key is missing.
     * @returns The translated string, or the key itself if no translation/fallback is found.
     */
    instant<K extends TranslationKey>(key: K, params?: ExtractParams<K>, fallback?: TranslationKey | string): string    
    {
        return this.tradCoreServ.instant(key, params, fallback);
    }

    /**
     * Translates a key and returns a reactive Angular Signal.
     * The Signal will automatically update whenever the active language changes.
     * 
     * @param key The translation key (e.g. 'HOME.TITLE').
     * @param params An optional object containing variables for string interpolation.
     * @param fallback An optional fallback translation key or raw string to use if the primary key is missing.
     * @returns A computed Signal containing the translated string.
     */
    translateSignal<K extends TranslationKey>(key: K, params?: ExtractParams<K>, fallback?: TranslationKey | string): Signal<string>    
    {
        return this.tradCoreServ.translateSignal(key, params, fallback);
    }
}