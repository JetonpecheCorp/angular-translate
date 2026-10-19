import { inject, Pipe, PipeTransform } from "@angular/core";
import { ExtractParams, TranslationKey } from "../tokens/auto-complete-key";
import { TraducteurCoreService } from "../services/TraducteurCoreService";

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
    standalone: true,
    // Réagit au changement de langue
    pure: false
})
export class TranslatePipe implements PipeTransform
{
    private translateServ = inject(TraducteurCoreService);

    transform<K extends TranslationKey>(key: K, params?: ExtractParams<K>, fallback?: TranslationKey | string): string 
    {
        if(!key || key.trim().length == 0)
            return "";

        return this.translateServ.instant(key, params, fallback);
    }
}