import { ChangeDetectorRef, Pipe, PipeTransform, inject } from "@angular/core";
import { TRANSLATION_CONFIG } from "../tokens/translation";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { TraducteurCoreService } from "../services/TraducteurCoreService";

const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

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
    standalone: true
})
export class TranslateDatePipe implements PipeTransform
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

    transform(value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions): string
    {
        if (value == null) 
            return "";

        const date = new Date(value);
        if (isNaN(date.getTime())) 
            return String(value);

        const lang = this.translationServ.langueActuelle();
        const defaultLang = this.config?.defaultLang || 'en';

        const langOptions = this.config?.formatConfig?.[lang]?.date;
        const defaultLangOptions = this.config?.formatConfig?.[defaultLang]?.date;
        const finalOptions = options ?? langOptions ?? defaultLangOptions;

        // LOGIQUE DE CACHE
        const cacheKey = `${lang}-${finalOptions ? JSON.stringify(finalOptions) : 'default'}`;
        let formatter = dateTimeFormatCache.get(cacheKey);
        
        if (!formatter) 
        {
            formatter = new Intl.DateTimeFormat(lang, finalOptions);
            dateTimeFormatCache.set(cacheKey, formatter);
        }

        return formatter.format(date.getTime());
    }
}