import { inject, Service } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy, Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TraducteurCoreService } from '../services/TraducteurCoreService';
import { TranslationKey } from '../tokens/auto-complete-key';

@Service()
export class TranslateTitleStrategy extends TitleStrategy
{
    private translateServ = inject(TraducteurCoreService);
    private title = inject(Title);
    private router = inject(Router);

    constructor() 
    {
        super();

        // Réagit au changement de langue pour mettre à jour le titre de l'onglet actif !
        toObservable(this.translateServ.langueActuelle)
            .pipe(takeUntilDestroyed())
            .subscribe(() => 
        {
            if (this.router.routerState) 
            {
                this.updateTitle(this.router.routerState.snapshot);
            }
        });
    }

    override updateTitle(snapshot: RouterStateSnapshot): void 
    {
        const titleKey = this.buildTitle(snapshot);
        
        if (titleKey) 
        {
            // Traduit la clé passée dans la route
            const translatedTitle = this.translateServ.instant(titleKey as TranslationKey);
            this.title.setTitle(translatedTitle);
        }
    }
}