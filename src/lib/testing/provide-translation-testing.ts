import { Provider, computed, signal } from '@angular/core';
import { TraducteurCoreService } from '../services/TraducteurCoreService';
import { TranslationService } from '../services/TranslationService';

/**
 * Utility provider for Angular unit tests.
 * Disables HTTP network calls and allows injecting a static translation dictionary.
 * 
 * @param mockTranslations A static dictionary of translations to be returned synchronously.
 * @returns An array of providers to configure the TestBed.
 */
export function provideTranslationTesting(mockTranslations: Record<string, string> = {}): Provider[] {
    
    // Création d'un faux service (Mock) qui remplace le vrai
    const mockService = {
        langueActuelle: signal('fr'),
        sensEcriture: computed(() => 'ltr'),
        
        init: async () => {},
        use: async (lang: string) => { mockService.langueActuelle.set(lang); },
        preload: async () => {},
        loadScope: async () => {},
        
        // Retourne la traduction mockée, ou simplement la clé si elle n'est pas mockée
        instant: (key: string) => mockTranslations[key] || key,
        
        // Simule le comportement réactif pour les templates
        translateSignal: (key: string) => computed(() => mockTranslations[key] || key)
    };

    return [
        { provide: TranslationService, useValue: mockService }
    ];
}