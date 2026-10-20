import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { TranslationDictionary } from "./translation";

/**
 * Interface to overload the way translations are loaded.
 */
export interface TranslationLoader
{
    /**
     * @param lang La langue demandée (ex: 'fr')
     * @param source L'URL ou le chemin source (ex: '/i18n/')
     */
    getTranslation(lang: string, source: string): Observable<TranslationDictionary> | Promise<TranslationDictionary>;
}

export const TRANSLATION_LOADER = new InjectionToken<TranslationLoader>('TRANSLATION_LOADER');