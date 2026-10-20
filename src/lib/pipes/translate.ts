import { ChangeDetectorRef, inject, Pipe, PipeTransform } from "@angular/core";
import { ExtractParams, TranslationKey } from "../tokens/auto-complete-key";
import { TraducteurCoreService } from "../services/TraducteurCoreService";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";

/**
 * A standalone pipe for translating strings directly within Angular HTML templates.
 * 
 * It automatically reacts to language changes (pure: false) without requiring page reloads.
 * 
 * @example
 * <!-- Basic usage -->
 * <h1>{{ 'HOME.TITLE' | translate }}</h1>
 * 
 * <!-- With interpolation parameters -->
 * <p>{{ 'HOME.WELCOME' | translate:{ name: 'Alice' } }}</p>
 * 
 * <!-- With a fallback key/string if the primary key is missing -->
 * <p>{{ 'USER.PHONE' | translate: undefined : 'USER.PHONE_NOT_EXISTS' }}</p>
 */
@Pipe({
    name: "translate",
    standalone: true
})
export class TranslatePipe implements PipeTransform
{
    private translateServ = inject(TraducteurCoreService);
    private cdr = inject(ChangeDetectorRef);

    constructor() 
    {
        toObservable(this.translateServ.langueActuelle)
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.cdr.markForCheck());
    }

    transform<K extends TranslationKey>(key: K, params?: ExtractParams<K>, fallback?: TranslationKey | string): string 
    {
        if(!key || key.trim().length == 0)
            return "";

        return this.translateServ.instant(key, params, fallback);
    }
}