import { inject, Pipe, PipeTransform } from "@angular/core";
import { TranslationService } from "../services/TranslationService";
import { TranslationKey } from "../tokens/auto-complete-key";

/**
 * Transforms a translation key into its corresponding translated string based on the active language.
 * This pipe is impure, meaning it automatically updates the view when the language changes.
 * 
 * @example
 * <!-- Basic usage -->
 * <h1>{{ 'HOME.TITLE' | translate }}</h1>
 * 
 * <!-- Usage with interpolation parameters -->
 * <p>{{ 'HOME.WELCOME' | translate:{ name: 'Alice' } }}</p>
 */
@Pipe({
    name: "translate",
    standalone: true,
    // Réagit au changement de langue
    pure: false
})
export class TranslatePipe implements PipeTransform
{
    private translateServ = inject(TranslationService);

    transform(key: TranslationKey, params?: Record<string, any>)
    {
        if(!key || key.trim().length == 0)
            return "";

        return this.translateServ.instant(key, params);
    }
}