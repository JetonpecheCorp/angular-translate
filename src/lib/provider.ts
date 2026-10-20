import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer, provideEnvironmentInitializer, Type } from "@angular/core";
import { MISSING_TRANSLATION_HANDLER, MissingTranslationHandler, TRANSLATION_CONFIG, TranslationConfig } from "./tokens/translation";
import { TraducteurCoreService } from "./services/TraducteurCoreService";
import { TRANSLATION_LOADER, TranslationLoader } from "./tokens/translation-loader";

export interface TranslationFeatureOptions {
    missingHandler?: Type<MissingTranslationHandler>;
    loader?: Type<TranslationLoader>;
}

/**
 * Configures the root providers for the translation library.
 * This should be called once in the root application configuration (e.g., `app.config.ts`).
 * 
 * @example
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideTranslation({ defaultLang: 'en', fallbackLang: 'fr' })
 *   ]
 * };
 * 
 * @param config The core configuration object for the translation service.
 * @param options Optional features like a custom missing translation handler.
 * @returns A set of environment providers required by the library.
 */
export function provideTranslation(
    config?: TranslationConfig, 
    options?: TranslationFeatureOptions
)
{
    return makeEnvironmentProviders([
        {
            provide: TRANSLATION_CONFIG,
            useValue: config
        },
        options?.loader ? 
        {
            provide: TRANSLATION_LOADER,
            useClass: options.loader
        } : [],
        options?.missingHandler ? 
        {
            provide: MISSING_TRANSLATION_HANDLER,
            useClass: options.missingHandler
        } : [],
        provideAppInitializer(() => {
            const service = inject(TraducteurCoreService);
            return service.init();
        })
    ]);
}

/**
 * Registers a specific translation scope to be lazy-loaded.
 * Ideal for feature modules or lazy-loaded routes to avoid loading all translations upfront.
 * 
 * @example
 * export const routes: Routes = [
 *   {
 *     path: 'admin',
 *     providers: [provideTranslationScope('admin', '/assets/i18n/admin/')],
 *     loadComponent: () => import('./admin.component')
 *   }
 * ];
 * 
 * @param scope The namespace for this specific translation file (e.g., 'admin').
 * @param source The URL path prefix where the JSON files are located (e.g., '/assets/i18n/admin/').
 * @returns A set of environment providers that triggers the lazy loading of the scope.
 */
export function provideTranslationScope(scope: string, source: string): EnvironmentProviders
{
    return makeEnvironmentProviders([
        provideEnvironmentInitializer(() =>
        {
            const tradServ = inject(TraducteurCoreService); 
            tradServ.loadScope(scope, source);
        })
    ]);
}