import { inject, Service } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { TranslationLoader } from "../tokens/translation-loader";
import { TranslationDictionary } from "../tokens/translation";

@Service()
export class DefaultTranslationLoader implements TranslationLoader
{
    private http = inject(HttpClient);

    getTranslation(lang: string, source: string): Observable<TranslationDictionary>
    {
        // Construit l'URL exacte par défaut : '/i18n/en.json'
        return this.http.get<TranslationDictionary>(`${source}${lang}.json`);
    }
}