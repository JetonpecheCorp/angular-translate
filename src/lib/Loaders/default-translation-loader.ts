import { inject, Service } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { TranslationLoader } from "../tokens/translation-loader";
import { TranslationDictionary } from "../tokens/translation";

@Service()
export class DefaultTranslationLoader implements TranslationLoader
{
    private http = inject(HttpClient);

    /**
     * @param lang The requested language code (e.g., 'en').
     * @param source The URL or local path source (e.g., '/i18n/').
     */
    getTranslation(lang: string, source: string): Observable<TranslationDictionary>
    {
        // Construit l'URL exacte par défaut : '/i18n/en.json'
        return this.http.get<TranslationDictionary>(`${source}${lang}.json`);
    }
}