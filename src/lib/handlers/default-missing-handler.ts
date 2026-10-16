import { Service } from "@angular/core";
import { MissingTranslationContext, MissingTranslationHandler } from "../tokens/translation";

@Service()
export class DefaultMissingHandler implements MissingTranslationHandler
{
    handle(context: MissingTranslationContext): string
    {
        console.warn(`[Translate] Missing translation for key: "${context.key}" in language: "${context.currentLang}"`);
        return context.key;
    }
}