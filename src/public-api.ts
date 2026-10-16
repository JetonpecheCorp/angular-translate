// Types & Contrats
export type { 
    TranslationConfig, 
    TranslationDictionary, 
    PluralForms, 
    MissingTranslationHandler, 
    MissingTranslationContext 
} from './lib/tokens/translation';

export * from './lib/provider';

export { TranslationService } from './lib/services/TranslationService';
export * from './lib/tokens/auto-complete-key';

export { TranslatePipe } from './lib/pipes/translate';
export { TranslateNumberPipe } from './lib/pipes/translate-number';
export { TranslateDatePipe } from './lib/pipes/translate-date';

export { TranslateDirective } from './lib/directives/translateDirective';