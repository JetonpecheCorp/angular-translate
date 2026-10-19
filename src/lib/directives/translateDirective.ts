import { Directive, effect, ElementRef, inject, input, Renderer2, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { TranslationKey } from "../tokens/auto-complete-key";
import { TranslationService } from "../services/TranslationService";

@Directive({
    selector: "[translate]",
    standalone: true
})
export class TranslateDirective
{
    translate = input<TranslationKey>();
    translateParams = input<Record<string, any> | undefined>();

    private translationServ = inject(TranslationService);
    private elementRef = inject(ElementRef);
    private renderer2 = inject(Renderer2);
    private sanitizer = inject(DomSanitizer);

    private readonly initialContentKey = this.elementRef.nativeElement.textContent?.trim();

    constructor()
    {
        effect(() => 
        {
            const rawKey = (this.translate() || this.initialContentKey) as TranslationKey;

            if (!rawKey)
                return;

            const translatedText = this.translationServ.instant(rawKey, this.translateParams());

            const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, translatedText) ?? '';
            this.renderer2.setProperty(this.elementRef.nativeElement, 'innerHTML', safeHtml);
        });
    }
}