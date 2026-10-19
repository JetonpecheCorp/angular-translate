export interface TranslationSchema {}

// autocomplete des cles des parametres a passer
export interface TranslationParams {}

// L'astuce (string & {}) force TS à garder le type ouvert et active l'autocomplétion
export type TranslationKey = keyof TranslationSchema | (string & {});

export type ExtractParams<K> = K extends keyof TranslationParams 
    ? TranslationParams[K] 
    : Record<string, any>;