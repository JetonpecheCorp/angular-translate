import { inject, Service } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { TranslationLoader } from "../tokens/translation-loader";
import { TRANSLATION_CONFIG, TranslationDictionary } from "../tokens/translation";

@Service()
export class DefaultTranslationLoader implements TranslationLoader
{
    private http = inject(HttpClient);
    private config = inject(TRANSLATION_CONFIG, { optional: true });

    /**
     * @param lang The requested language code (e.g., 'en').
     * @param source The URL or local path source (e.g., '/i18n/').
     */
    getTranslation(lang: string, source: string): Observable<TranslationDictionary>
    {
        let url = `${source}${lang}.json`;
        
        if (this.config?.version) 
        {
            const separator = url.includes('?') ? '&' : '?';
            // Supprime un éventuel '?' ou '&' mis au début par le développeur
            const cleanVersion = this.config.version.replace(/^[?&]/, '');
            url += `${separator}${cleanVersion}`;
        }

        return this.http.get<TranslationDictionary>(url);
    }
}