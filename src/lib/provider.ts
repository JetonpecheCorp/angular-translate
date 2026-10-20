import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer, provideEnvironmentInitializer, Provider, Type } from "@angular/core";
import { MISSING_TRANSLATION_HANDLER, MissingTranslationHandler, TRANSLATION_CONFIG, TranslationConfig, TranslationScopeConfig } from "./tokens/translation";
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
 *     providers: [provideTranslationScope({ scope: 'admin', source: '/assets/i18n/admin/' })],
 *     loadComponent: () => import('./admin.component')
 *   }
 * ];
 * 
 * @param config The configuration object for the translation scope.
 * @returns A set of environment providers that triggers the lazy loading of the scope.
 */
export function provideTranslationScope(config: TranslationScopeConfig): EnvironmentProviders
{
    const providers: Array<Provider | EnvironmentProviders> = [];

    // Si l'utilisateur fournit un loader spécifique, on le déclare dans l'injecteur de cette route
    if (config.loader) 
        providers.push(config.loader);

    providers.push(provideEnvironmentInitializer(() =>
    {
        const globalConfig = inject(TRANSLATION_CONFIG, { optional: true });
        
        if (!globalConfig) 
        {
            throw new Error(
                `[Angular Translate] Erreur fatale : Vous essayez de charger le scope "${config.scope}" via provideTranslationScope(), mais le service principal n'a pas été initialisé. Veuillez ajouter provideTranslation() dans votre app.config.ts.`
            );
        }

        const tradServ = inject(TraducteurCoreService); 
        
        // On récupère l'instance du loader spécifique s'il a été défini
        const customLoader = config.loader ? inject(config.loader) : undefined;

        tradServ.loadScope(config.scope, config.source, customLoader);
    }));

    return makeEnvironmentProviders(providers);
}