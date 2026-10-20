import { ChangeDetectorRef, Pipe, PipeTransform, inject } from "@angular/core";
import { TRANSLATION_CONFIG } from "../tokens/translation";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { TraducteurCoreService } from "../services/TraducteurCoreService";

const numberFormatCache = new Map<string, Intl.NumberFormat>();

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
    standalone: true
})
export class TranslateNumberPipe implements PipeTransform
{
    private translationServ = inject(TraducteurCoreService);
    private config = inject(TRANSLATION_CONFIG, { optional: true });
    private cdr = inject(ChangeDetectorRef);

    constructor() 
    {
        toObservable(this.translationServ.langueActuelle)
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.cdr.markForCheck());
    }

    transform(value: number | string | null | undefined, options?: Intl.NumberFormatOptions): string
    {
        if (value == null) 
            return "";

        const numberValue = typeof value == 'string' ? parseFloat(value) : value;

        if (isNaN(numberValue)) 
            return String(value);

        const lang = this.translationServ.langueActuelle();
        const defaultLang = this.config?.defaultLang || 'en';

        // Cherche la config pour la langue active
        const langOptions = this.config?.formatConfig?.[lang]?.number;
        
        // Cherche la config de secours (langue par défaut)
        const defaultLangOptions = this.config?.formatConfig?.[defaultLang]?.number;

        // Cascade : Options HTML > Config Langue > Config DefaultLang
        const finalOptions = options ?? langOptions ?? defaultLangOptions;

                // LOGIQUE DE CACHE
        const cacheKey = `${lang}-${finalOptions ? JSON.stringify(finalOptions) : 'default'}`;
        let formatter = numberFormatCache.get(cacheKey);
        
        if (!formatter) 
        {
            formatter = new Intl.NumberFormat(lang, finalOptions);
            numberFormatCache.set(cacheKey, formatter);
        }

        return formatter.format(numberValue);
    }
}