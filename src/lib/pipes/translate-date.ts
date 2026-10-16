import { Pipe, PipeTransform, inject } from "@angular/core";
import { TranslationService } from "../services/TranslationService";

/**
 * Formats a given date according to the currently active language using the native `Intl.DateTimeFormat` API.
 * The output automatically updates when the application language changes.
 * 
 * @example
 * <!-- Default formatting -->
 * <span>{{ user.createdAt | translateDate }}</span>
 * 
 * <!-- With custom Intl.DateTimeFormatOptions -->
 * <span>{{ user.createdAt | translateDate:{ dateStyle: 'full', timeStyle: 'short' } }}</span>
 */
@Pipe({
    name: "translateDate",
    standalone: true,
    // Réagit au changement de langue
    pure: false 
})
export class TranslateDatePipe implements PipeTransform
{
    private translationServ = inject(TranslationService);

    transform(value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string
    {
        if (value == null) 
            return "";

        const date = new Date(value);
        if (isNaN(date.getTime())) 
            return String(value);

        const lang = this.translationServ.currentLang();
        return new Intl.DateTimeFormat(lang, options).format(date);
    }
}