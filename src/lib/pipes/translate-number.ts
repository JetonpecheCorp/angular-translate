import { Pipe, PipeTransform, inject } from "@angular/core";
import { TranslationService } from "../services/TranslationService";

/**
 * Formats a number or currency according to the currently active language using the native `Intl.NumberFormat` API.
 * The output automatically updates when the application language changes.
 * 
 * @example
 * <!-- Basic number formatting (e.g., 1,250.50 or 1 250,50) -->
 * <span>{{ data.totalViews | translateNumber }}</span>
 * 
 * <!-- Currency formatting -->
 * <span>{{ product.price | translateNumber:{ style: 'currency', currency: 'EUR' } }}</span>
 * 
 * <!-- Percentage formatting -->
 * <span>{{ data.successRate | translateNumber:{ style: 'percent' } }}</span>
 */
@Pipe({
    name: "translateNumber",
    standalone: true,
    // reagir au changement de langue
    pure: false
})
export class TranslateNumberPipe implements PipeTransform
{
    private translationServ = inject(TranslationService);

    transform(value: number | string | null | undefined, options?: Intl.NumberFormatOptions): string
    {
        if (value == null) 
            return "";

        const numberValue = typeof value == 'string' ? parseFloat(value) : value;
        if (isNaN(numberValue)) 
            return String(value);

        const lang = this.translationServ.currentLang();
        return new Intl.NumberFormat(lang, options).format(numberValue);
    }
}