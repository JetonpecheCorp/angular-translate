import { Provider, computed, signal } from '@angular/core';
import { TranslationService } from '../services/TranslationService';
import { TraducteurCoreService } from '../services/TraducteurCoreService';
import { TranslationKey } from '../tokens/auto-complete-key';

/**
 * Utility provider for Angular unit tests (Jest/Jasmine).
 * Disables HTTP network calls and allows injecting a static translation dictionary.
 * Mocks both the public and core services simultaneously to prevent Pipes and Directives from crashing.
 * 
 * @param mockTranslations A static dictionary of translations to be returned synchronously.
 * @returns An array of providers to configure the TestBed.
 */
export function provideTranslationTesting(mockTranslations: Record<string, string> = {}): Provider[] 
{
    // 1. Faux interpolateur léger pour remplacer les {param} dans les tests
    const mockInterpolate = (text: string, params?: Record<string, any>) => 
    {
        if (!params) return text;
        return Object.keys(params).reduce((acc, key) => acc.replace(new RegExp(`{${key}}`, 'g'), params[key]), text);
    };

    // 2. Le Signal partagé pour que le changement de langue impacte tout
    const mockLangSignal = signal('fr');
    const mockDirSignal = computed<'ltr' | 'rtl'>(() => 'ltr');

    // 3. Mock du service CORE (injecté par les directives et les pipes)
    const mockCoreService: Partial<TraducteurCoreService> = 
    {
        langueActuelle: mockLangSignal,
        sensEcriture: mockDirSignal,
        init: async () => { },
        use: async (lang: string) => { mockLangSignal.set(lang); },
        preload: async () => { },
        loadScope: async () => { },
        instant: (key: TranslationKey | string, params?: Record<string, any>, fallback?: string) => 
        {
            const text = mockTranslations[key as string] || fallback || (key as string);
            return mockInterpolate(text, params);
        }
    };

    // 4. Mock du service PUBLIC (injecté par les composants utilisateurs)
    const mockPublicService: Partial<TranslationService> = 
    {
        currentLang: mockLangSignal,
        dir: mockDirSignal,
        use: async (lang: string) => mockCoreService.use!(lang),
        preload: async () => { },
        instant: (key: TranslationKey, params?: Record<string, any>, fallback?: string) =>
            mockCoreService.instant!(key, params, fallback),
        translateSignal: (key: TranslationKey, params?: Record<string, any>, fallback?: string) =>
            computed(() => mockCoreService.instant!(key, params, fallback))
    };

    return [
        { provide: TraducteurCoreService, useValue: mockCoreService },
        { provide: TranslationService, useValue: mockPublicService }
    ];
}