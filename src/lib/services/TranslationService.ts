import { inject, Service, Signal } from "@angular/core";
import { TraducteurCoreService } from "./TraducteurCoreService";
import { TranslationKey } from "../tokens/auto-complete-key";

@Service()
export class TranslationService
{
    private tradCoreServ = inject(TraducteurCoreService);

    /**
     * A reactive signal containing the currently active language code.
     * @example 'en', 'fr', 'es'
     */
    readonly currentLang = this.tradCoreServ.langueActuelle.asReadonly();

    /**
     * A reactive signal indicating the text direction based on the current language.
     * Returns 'rtl' (Right-to-Left) for languages like Arabic or Hebrew, and 'ltr' (Left-to-Right) for others.
     */
    readonly dir = this.tradCoreServ.sensEcriture;

    /**
     * Changes the active language of the application.
     * Automatically fetches the required translation files if they are not already cached.
     * 
     * @param lang The language code to switch to (e.g., 'fr').
     * @returns A promise that resolves when the new language is fully loaded and applied.
     */
    async use(lang: string): Promise<void>
    {
        return this.tradCoreServ.use(lang);
    }

    /**
     * Preloads the translation files for a specific language in the background.
     * Ideal for triggering on mouse hover to ensure instant language switching.
     * 
     * @param lang The language code to preload.
     */
    async preload(lang: string): Promise<void>
    {
        return this.tradCoreServ.preload(lang);
    }

    /**
     * Synchronously translates a given key based on the currently active language.
     * 
     * @param key The translation key (e.g., 'HOME.TITLE').
     * @param params Optional parameters for string interpolation.
     * @returns The translated string, or the fallback representation if not found.
     */
    instant(key: TranslationKey, params?: Record<string, any>): string
    {
        return this.tradCoreServ.instant(key, params);
    }

    /**
     * Returns a reactive Signal that automatically updates whenever the active language changes.
     * 
     * @param key The translation key (e.g., 'HOME.TITLE').
     * @param params Optional parameters for string interpolation.
     * @returns A Signal emitting the translated string.
     */
    translateSignal(key: TranslationKey, params?: Record<string, any>): Signal<string>
    {
        return this.tradCoreServ.translateSignal(key, params);
    }
}