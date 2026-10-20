import { Directive, TemplateRef, ViewContainerRef, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { TranslationKey, ExtractParams } from '../tokens/auto-complete-key';
import { TraducteurCoreService } from '../services/TraducteurCoreService';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

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
    private cdr = inject(ChangeDetectorRef);

    constructor() 
    {
        // Force la mise à jour du bloc HTML quand la langue change
        toObservable(this.translationService.langueActuelle)
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.cdr.markForCheck());
    }

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