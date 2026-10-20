import { isDevMode, Service } from "@angular/core";
import { MissingTranslationContext, MissingTranslationHandler } from "../tokens/translation";

@Service()
export class DefaultMissingHandler implements MissingTranslationHandler
{
    handle(context: MissingTranslationContext): string
    {
        console.warn(`[Translate] Missing translation for key: "${context.key}" in language: "${context.currentLang}"`);
        
        // En développement (ng serve), affiche un indicateur visuel bloquant (ex: [❌ HOME.TITLE])
        if (isDevMode())
            return `[❌ ${context.key}]`;

        // En production (ng build), on retourne juste la clé pour limiter la casse
        return context.key;
    }
}