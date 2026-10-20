import { Directive, effect, ElementRef, inject, input, Renderer2, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ExtractParams, TranslationKey } from "../tokens/auto-complete-key";
import { TraducteurCoreService } from "../services/TraducteurCoreService";

/**
 * A standalone directive for translating and injecting rich HTML content safely.
 * 
 * Unlike the `TranslatePipe` which outputs raw text, this directive sanitizes 
 * the translated string and binds it to the element's `innerHTML`. It is ideal 
 * when translations contain HTML tags (e.g., `<b>`, `<a>`, `<br>`).
 * 
 * @example
 * <!-- Basic usage -->
 * <div [translate]="'ARTICLE.CONTENT'"></div>
 * 
 * <!-- With interpolation parameters -->
 * <div [translate]="'ARTICLE.GREETING'" [translateParams]="{ name: 'Alice' }"></div>
 * 
 * <!-- With a fallback key/string -->
 * <div [translate]="'ARTICLE.DESCRIPTION'" [translateFallback]="'ARTICLE.NO_DESCRIPTION'"></div>
 */
@Directive({
    selector: "[translate]",
    standalone: true
})
export class TranslateDirective
{
    translate = input<TranslationKey>();
    translateParams = input<Record<string, any> | undefined>();
    translateFallback = input<TranslationKey | string | undefined>();

    private translationServ = inject(TraducteurCoreService);
    private elementRef = inject(ElementRef);
    private renderer2 = inject(Renderer2);
    private sanitizer = inject(DomSanitizer);

    private readonly initialContentKey = this.elementRef.nativeElement.textContent?.trim();

    // Stockage de l'état précédent
    private lastKey?: string;

    // Propriété pour stocker la version sérialisée des anciens paramètres
    private lastParamsStringified?: string;

    constructor()
    {
        effect(() => 
        {
            const rawKey = (this.translate() || this.initialContentKey) as TranslationKey;
            
            // 1. On lit les dépendances (le signal est enregistré)
            const params = this.translateParams();
            const currentParamsStringified = params ? JSON.stringify(params) : undefined;
            const fallback = this.translateFallback();

            if (!rawKey) 
                return;

            // éviter l'exécution inutile de l'API de DOM / Sanitation
            if (this.lastKey === currentParamsStringified) 
                return;

            // Mise à jour de l'état
            this.lastKey = rawKey;
            this.lastParamsStringified = currentParamsStringified;

            const translatedText = this.translationServ.instant(
                rawKey, 
                params as ExtractParams<TranslationKey>, 
                fallback
            );

            const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, translatedText) ?? '';
            this.renderer2.setProperty(this.elementRef.nativeElement, 'innerHTML', safeHtml);
        });
    }
}