export interface TranslationSchema {}

// L'astuce (string & {}) force TS à garder le type ouvert et active l'autocomplétion
export type TranslationKey = keyof TranslationSchema | (string & {});