import { InjectionToken } from "@angular/core";

/**
 * Global configuration options for the translation service.
 */
export interface TranslationConfig
{
    /**
     * The default language code to load on application startup.
     */
    defaultLang: string;

    /**
     * The fallback language(s) to use when a specific translation key is missing.
     * Can be a single language code string, or an array of language codes for a fallback chain.
     * 
     * @example 'en' or ['fr', 'en']
     * @default 'en'
     */
    fallbackLang?: string | string[];

    /**
     * An array of URL paths or remote endpoints where the JSON translation files are located.
     * The library will automatically append `[lang].json` to these paths.
     * 
     * @example ['/i18n/', 'https://api.mycdn.com/i18n/']
     * @default ['/i18n/']
     */
    sources?: string[];

    /**
     * If true, the library will attempt to detect the user's browser language on the first visit.
     * 
     * @default false
     */
    autoDetect?: boolean;

    /**
     * If true, the active language will be saved in the browser's localStorage to persist across user sessions.
     * 
     * @default true
     */
    persist?: boolean;

    /**
     * The query string parameter name used to extract and set the language from the URL.
     * 
     * @example 
     * // Setting urlParam to 'lang' will intercept URLs like: "?lang=fr"
     */
    urlParam?: string;

    /**
     * The index of the URL path segment used to extract the language.
     * Ideal for URL-based localization where the language is part of the path.
     * 
     * @example
     * // For the URL "https://domain.com/fr/home"
     * // The path segments are ['', 'fr', 'home']
     * // Setting `pathIndex: 1` will automatically detect and apply 'fr'.
     */
    pathIndex?: number;

    /**
     * Language-specific formatting configuration for dates and numbers.
     * The keys should be the language codes (e.g., 'fr', 'en').
     * If the current language has no specific configuration, the system 
     * will fallback to the configuration of the `defaultLang`.
     * 
     * @example
     * formatConfig: {
     *   'fr': { number: { style: 'currency', currency: 'EUR' } },
     *   'en': { number: { style: 'currency', currency: 'USD' } }
     * }
     */
    formatConfig?: Record<string, TranslationFormatOptions>;
}

export interface TranslationFormatOptions 
{
    /** 
     * Default options for the native `Intl.NumberFormat` API. 
     * @example { style: 'currency', currency: 'EUR' } 
     */
    number?: Intl.NumberFormatOptions;

    /** 
     * Default options for the native `Intl.DateTimeFormat` API. 
     * @example { dateStyle: 'short', timeStyle: 'short' } 
     */
    date?: Intl.DateTimeFormatOptions;
}

/**
 * Represents the standardized plural forms based on the `Intl.PluralRules` specification.
 * Used for grammatical number agreements depending on the active language.
 */
export interface PluralForms
{
    /**
     * The string to use when the count dictates the 'zero' category.
     * Note: In many languages (like English or French), 0 falls under 'other' or 'one'. 
     * This is strictly for languages with a distinct 'zero' grammatical category (e.g., Latvian).
     */
    zero?: string;

    /**
     * The string to use for singular items.
     * @example 1 in English ("1 item") or 0/1 in French ("0 article", "1 article").
     */
    one?: string;

    /**
     * The string to use for exactly two items.
     * Applicable in languages with a specific "dual" form (e.g., Arabic, Slovenian, Welsh).
     */
    two?: string;

    /**
     * The string to use for a small number of items.
     * Commonly used in Slavic languages (e.g., 2, 3, 4 in Russian or Polish).
     */
    few?: string;

    /**
     * The string to use for larger numbers.
     * Used in languages with a specific "many" category (e.g., 11 to 99 in Arabic, or 5+ in Russian).
     */
    many?: string;

    /**
     * The default fallback string when no specific plural rule matches the given count.
     * This field is mandatory as it covers all remaining cases.
     */
    other: string;

    [key: string]: string | undefined;
}

/**
 * Represents any valid leaf or branch value inside a translation dictionary.
 */
export type TranslationValue = string | PluralForms | TranslationDictionary;

/**
 * Recursive structure representing a parsed JSON translation file.
 */
export interface TranslationDictionary
{
    [key: string]: TranslationValue;
}

/**
 * The contextual data provided to the `MissingTranslationHandler` when a key cannot be resolved.
 */
export interface MissingTranslationContext
{
    /**
     * The translation key that was requested but not found (e.g., 'AUTH.LOGIN.SUBMIT').
     */
    key: string;

    /**
     * The language code that was active when the lookup failed.
     */
    currentLang: string;

    /**
     * The interpolation parameters that were passed along with the missing key.
     */
    params?: Record<string, any>;
}

/**
 * A custom strategy interface to intercept and process unresolved translation keys.
 * Implement this to define your own fallback behavior, warnings, or external logging mechanism.
 */
export interface MissingTranslationHandler
{
    /**
     * Processes an unresolved translation key and returns a fallback string to display in the UI.
     * 
     * @param context Contextual details about the missing translation request.
     * @returns The fallback string that will be rendered on the screen.
     */
    handle(context: MissingTranslationContext): string;
}

/**
 * Injection token for configuring the translation library at the root level.
 */
export const TRANSLATION_CONFIG = new InjectionToken<TranslationConfig>("TRANSLATION_CONFIG");

/**
 * Injection token to provide a custom implementation of the `MissingTranslationHandler`.
 */
export const MISSING_TRANSLATION_HANDLER = new InjectionToken<MissingTranslationHandler>("MISSING_TRANSLATION_HANDLER");