// Types & Contrats
export type { 
    TranslationConfig, 
    TranslationScopeConfig,
    TranslationDictionary, 
    PluralForms, 
    MissingTranslationHandler, 
    MissingTranslationContext 
} from './lib/tokens/translation';

export * from './lib/tokens/translation-loader';
export * from './lib/strategies/translate-title-strategy';

export * from './lib/provider';

export { TranslationService } from './lib/services/TranslationService';
export * from './lib/tokens/auto-complete-key';

export { TranslatePipe } from './lib/pipes/translate';
export { TranslateNumberPipe } from './lib/pipes/translate-number';
export { TranslateDatePipe } from './lib/pipes/translate-date';

export { TranslateDirective } from './lib/directives/translateDirective';
export { TranslateGroupDirective } from './lib/directives/translateGroupDirective';
export * from './lib/testing/provide-translation-testing';