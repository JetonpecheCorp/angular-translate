import { Directive, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { TranslationKey, ExtractParams } from '../tokens/auto-complete-key';
import { TraducteurCoreService } from '../services/TraducteurCoreService';

/**
 * A structural guideline to avoid repeating the pipe `| translate`
 * when a block contains many translations.
 * 
 * @example
 * <ng-container *translateGroup="let t">
 *    <h1>{{ t('HOME.TITLE') }}</h1>
 *    <p>{{ t('HOME.SUBTITLE', { name: 'Alice' }) }}</p>
 * </ng-container>
 */
@Directive({
    selector: '[translateGroup]',
    standalone: true
})
export class TranslateGroupDirective implements OnInit
{
    private templateRef = inject(TemplateRef);
    private vcr = inject(ViewContainerRef);
    private translationService = inject(TraducteurCoreService);

    ngOnInit()
    {
        // Le contexte injecté dans la vue (le 'let t')
        const context = {
            $implicit: (key: TranslationKey, params?: ExtractParams<TranslationKey>, fallback?: TranslationKey | string): string =>
            {
                // Fait appel au service qui est réactif (basé sur les Signals)
                return this.translationService.instant(key, params, fallback);
            }
        };

        // Création de la vue avec ce contexte
        this.vcr.createEmbeddedView(this.templateRef, context);
    }
}