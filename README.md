# @jetonpeche/angular-translate

[Documentation en français](https://github.com/JetonpecheCorp/angular-translate/blob/main/README.fr.md)

A modern, lightweight, and **Signal-based** i18n translation library for Angular 22+ applications.  
Designed from the ground up for modern Angular architecture, it features **seamless SSR integration (TransferState)**, strict typing for your translation keys, and ultra-fast AST caching.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [1. Translation Service (Signals)](#1-translation-service-signals)
  - [2. Standalone Pipes](#2-standalone-pipes)
  - [3. Standalone Directive](#3-standalone-directive)
  - [4. Structural Directive (*translateGroup)](#4-structural-directive-translategroup)
  - [5. Inline Fallback](#5-inline-fallback)
- [Strict Typing & CLI (Autocompletion)](#strict-typing--cli-autocompletion)
- [i18n Linter (Key Checking)](#i18n-linter-key-checking)
- [Key Extractor (Code => JSON)](#key-extractor-code--json)
- [Unit Testing](#unit-testing)
- [Lazy-Loading (Translation Scopes)](#lazy-loading-translation-scopes)
- [Network Loading Indicator](#network-loading-indicator)
- [Advanced Features](#advanced-features)
  - [1. Native Pluralization (CLDR Standard)](#1-native-pluralization-cldr-standard)
  - [2. Context (Gender, Role) & Combinations](#2-context-gender-role--combinations)
  - [3. Global Formatting per Language](#3-global-formatting-per-language)
  - [4. Custom Loader (Loading from DB / API)](#4-custom-loader-loading-from-db--api)
  - [5. Missing Key Monitoring (Sentry, Datadog)](#5-missing-key-monitoring-sentry-datadog)
  - [6. Micro-Frontends: Component Lazy-Loading](#6-micro-frontends-component-lazy-loading)
  - [7. Automatic Page Title Translation (SEO)](#7-automatic-page-title-translation-seo)
  - [Declaration in app.config.ts](#declaration-in-appconfigts)
- [Under the Hood (How it works)](#under-the-hood-how-it-works)

## Features

- **Built-in Signals**: Fully reactive translations using Angular Signals. No RxJS boilerplate required.
- **SSR Ready (TransferState)**: Zero flickering or duplicate HTTP requests. Server-loaded translations are seamlessly injected into the client state.
- **Strict Typing (Autocompletion)**: A built-in CLI generates strict TypeScript definitions from your JSON files, providing perfect autocomplete for your keys AND parameters.
- **i18n Linter & Extractor**: Verify the integrity of your translations and automatically extract new keys from your HTML/TS code.
- **Test-Friendly**: Includes a utility provider to mock translations in your unit tests instantly.
- **Lazy-Loading (Scopes)**: Load specific translation files only when navigating to feature modules.
- **AST Caching**: Ultra-fast string interpolation parsing with built-in memory caching.
- **Native Formatting**: Includes `translateDate` and `translateNumber` pipes that leverage the native `Intl` API.

## Installation

```bash
npm install @jetonpeche/angular-translate
```

## Configuration

Configure the library at the root level in your `app.config.ts`.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslation } from '@jetonpeche/angular-translate';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTranslation({
      defaultLang: 'en',
      fallbackLang: ['fr'], // Fallback chain supported!
      sources: ['/i18n/'], // Path to your JSON files
      version: 'v=1.0.4', // Invalidates browser cache on new releases
      retryAttempts: 2,  // Useful for unstable mobile connections
      
      // Customize default {variable} interpolation markers
      interpolation: {
        prefix: '{{',
        suffix: '}}'
      },
      
      debug: true, // Displays detailed logs and load times in the console
      autoDetect: true,
      persist: true,
      // (Optional) Global formatting configuration per language
      formatConfig: {
        'en': {
          number: { style: 'currency', currency: 'USD' },
          date: { dateStyle: 'short' }
        },
        'fr': {
          number: { style: 'currency', currency: 'EUR' }
        }
      }
    })
  ]
};
```

### Advanced Options Details
- `version` **(Cache Busting)**: Browsers often cache `.json` files. Setting this property appends a query parameter to your HTTP requests (e.g., `/i18n/en.json?v=1.0.4`), forcing the browser to download your latest translations after an update.

- `retryAttempts`: If an HTTP request fails (4G network loss, timeout), the library will attempt to reload the language file the specified number of times before falling back to alternative languages.

- `interpolation`: By default, the library replaces variables using the `{name}` syntax. If you are migrating from another library, you can configure your own markers (like `{{name}}` or `__name__`).

- `debug`: Enables detailed tracking in the browser console. Ideal during development to audit JSON resolution times, verify Scope loading, or spot overwritten keys.

## Usage

### 1. Translation Service (Signals)
Inject the `TranslationService` to access reactive properties and change the active language.

```ts
import { Component, inject } from '@angular/core';
import { TranslationService } from '@jetonpeche/angular-translate';

@Component({
  selector: 'app-header',
  template: `
    <header [dir]="translate.dir()">
      <!-- currentLang() is a Signal -->
      <p>Current language: {{ translate.currentLang() }}</p>
      
      <button (click)="changeLang('fr')" (mouseenter)="translate.preload('fr')">
        Switch to French
      </button>
    </header>
  `
})
export class HeaderComponent
{
  translate = inject(TranslationService);

  changeLang(lang: string) 
  {
    this.translate.use(lang);
  }
}
```

### 2. Standalone Pipes
Easily translate text, dates, and numbers directly in your HTML templates.  
All pipes are reactive and update automatically when the language changes.

```ts
import { TranslatePipe, TranslateDatePipe, TranslateNumberPipe } from '@jetonpeche/angular-translate';

@Component({
  standalone: true,
  imports: [TranslatePipe, TranslateDatePipe, TranslateNumberPipe],
  template: `
    <!-- Basic translation -->
    <h1>{{ 'HOME.TITLE' | translate }}</h1>

    <!-- Interpolation -->
    <p>{{ 'HOME.WELCOME' | translate:{ name: 'Alice' } }}</p>

    <!-- Native date formatting -->
    <p>Date: {{ user.birthDate | translateDate:{ dateStyle: 'full' } }}</p>

    <!-- Native currency/number formatting (options are optional if configured in app.config.ts) -->
    <p>Price: {{ product.price | translateNumber }}</p>
  `
})
export class MyComponent {}
```

### 3. Standalone Directive
For complex HTML content that needs to be sanitized against XSS vulnerabilities, use the `[translate]` directive.  
It uses the `DomSanitizer` and binds the result to `innerHTML`.

```ts
import { TranslateDirective } from '@jetonpeche/angular-translate';

@Component({
  standalone: true,
  imports: [TranslateDirective],
  template: `
    <div [translate]="'HOME.DESCRIPTION'" 
        [translateParams]="{ boldText: 'Awesome' }"
        [translateFallback]="'HOME.NO_DESCRIPTION'">
    </div>
  `
})
export class MyComponent {}
```

### 4. Structural Directive (*translateGroup)
When an HTML block contains multiple translations, avoid repeating the `| translate` pipe by  
using the `*translateGroup` structural directive.

```html
<ng-container *translateGroup="let t">
   <h1>{{ t('HOME.TITLE') }}</h1>
   <p>{{ t('HOME.SUBTITLE', { name: 'Alice' }) }}</p>
   <button>{{ t('HOME.BTN') }}</button>
</ng-container>
```

### 5. Inline Fallback
You can provide a fallback key or raw text as a 3rd parameter just in case the primary translation is missing.

```html
<!-- If USER.PHONE is missing, it will use the USER.PHONE_NOT_EXISTS key -->
<p>{{ 'USER.PHONE' | translate: undefined : 'USER.PHONE_NOT_EXISTS' }}</p>

<!-- You can also pass raw text -->
<p>{{ 'USER.PHONE' | translate: undefined : 'No number provided...' }}</p>
```

## Strict Typing & CLI (Autocompletion)
Never make a typo on a translation key again! The CLI generates strict TypeScript definitions, featuring **automatic parameter and type detection**.  
Avoid missing translations before deploying to production! The library includes a Linter that compares all your languages against a reference file.

### Declaring types in your JSON
In your JSON files, you can strongly type your variables using the `{variable:type}` syntax. If omitted, it defaults to `string`.

```json
{
  "ACCOUNT.BALANCE": "The balance for {name:string} is {amount:number} on {date:Date}."
}
```

### Running the CLI
Make sure your JSON translation files are ready (e.g., `public/i18n/en.json`) and run the script using your main language as the reference:

| Parameter | Alias | Description | Default / Required |
|:--- |:--- |:--- |:--- |
| `--input` | `-i` | Source JSON file used as a reference (e.g., `en.json`). | **Required** |
| `--output` | `-o` | Path for the generated TypeScript declaration file. | `src/translation-types.d.ts` `|
| `--watch` | `-w` | Enables watch mode to regenerate types on every save. | `false` |

```bash
# Standard generation
npx angular-translate-cli -i public/i18n/en.json -o src/translation-types.d.ts  

# Enable Watch Mode (Auto-recompile on save)
npx angular-translate-cli -i public/i18n/en.json --watch

# Creates folders if they don't exist
npx angular-translate-cli -i en.json -o src/some/new/folder/translation-types.d.ts
```

>Note: Make sure to include the generated `translation-types.d.ts` in your tsconfig.app.json or link it via a triple-slash directive in your `main.ts`!

Can be used in package.json under scripts

```json
"scripts": 
{
  "i18n": "angular-translate-cli -i public/i18n/en.json"
}
```

## i18n Linter (Key Checking)
Prevent missing translations from reaching production! The library includes a Linter that cross-checks all your language files.

| Parameter | Alias | Description | Default / Required |
|:--- |:--- |:--- |:--- |
| `--dir` | `-d` | Folder containing all your JSON translation files. | **Required** |

```bash
# Checks the integrity of all JSON files in the folder
npx angular-translate-check --dir public/i18n
```

The script will exit with an error (code 1, perfect for breaking a CI/CD pipeline) if it finds missing or dead/obsolete keys in your other language files.

## Key Extractor (Code => JSON)
Automatically detect new keys added in your source code (`.html` and `.ts`) and insert them into your reference JSON file.

| Parameter | Alias | Description | Default / Required |
|:--- |:--- |:--- |:--- |
| `--json` | `-j` | Reference JSON file to check or update. | **Required** |
| `--src` | `-s` | Folder containing your source code to analyze. | `src/` |
| `--add` | *(none)* | Automatically inserts missing keys found in the code into the JSON. | `false` |
| `--value` | `-v` | Default value assigned to newly added keys (requires `--add`). | `NOT_TRANSLATE_VALUE` |

```bash
# Scans the code and reports undocumented keys
npx angular-translate-extract -j public/i18n/en.json -s src/

# Automatically adds missing keys to the JSON with a default value
npx angular-translate-extract -j public/i18n/en.json -s src/ --add --value "NOT_TRANSLATE_VALUE"
```

## Unit Testing
To write unit tests (Jest, Jasmine, Karma) without triggering actual HTTP requests, use the `provideTranslationTesting` utility provider.   
It instantly mocks the library's services and automatically handles parameter interpolation to make your assertions (`expect`) incredibly simple.

```ts
import { TestBed } from '@angular/core/testing';
import { provideTranslationTesting } from '@jetonpeche/angular-translate';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Injects a static dictionary for the test
        provideTranslationTesting({
            'HOME.TITLE': 'Test Title',
            'ACCOUNT.BALANCE': 'Balance: {amount}' // Interpolation works out of the box!
        })
      ]
    });
  });

  it('should display the balance with the replaced parameter', () => {
    const fixture = TestBed.createComponent(MyComponent);
    fixture.componentInstance.amount = 150;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // The mock automatically replaces {amount} with 150
    expect(compiled.querySelector('.balance')?.textContent).toBe('Balance: 150');
  });
});
```

>**Internal Note**: `provideTranslationTesting` mocks both the public service and the internal core engine.  
This ensures that your components, directives, and pipes tied to translations will work flawlessly without throwing injection errors.


## Lazy-Loading (Translation Scopes)
Applications often require a hybrid approach: loading core translations quickly via local JSON files, while fetching a specific module's translations (like an Admin dashboard) from a remote API or database.  

`@jetonpeche/angular-translate` allows assigning an exclusive Loader to a specific Scope. If defined, this custom loader will override the global loader only for that module.  

In this example, instead of reading a local file, we query a REST API. The `source` property is no longer a folder path, but an API URL.  
Simply pass your custom class into the scope configuration's `loader` property.

```ts
import { Injectable, inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslationLoader } from '@jetonpeche/angular-translate';

@Service()
export class AdminApiLoader implements TranslationLoader 
{
  private http = inject(HttpClient);

  getTranslation(lang: string, source: string) 
  {
    // source = "[https://api.my-backend.com/translations/admin/](https://api.my-backend.com/translations/admin/)"
    // Requesting from a remote API instead of a local JSON
    return this.http.get(`${source}${lang}`);
  }
}

import { Routes } from '@angular/router';
import { provideTranslationScope } from '@jetonpeche/angular-translate';

export const routes: Routes = [
  {
    path: 'admin',
    // Automatically fetches '/i18n/admin/[lang].json' when hitting this route
    providers: [
      provideTranslationScope({ 
        scope: 'admin', 
        source: '/i18n/admin/', // The URL passed to the loader
        loader: AdminApiLoader // Overrides the loader exclusively for this scope!
      })
    ],
    loadComponent: () => import('./admin/admin.component')
  }
];
```
>**Note**: Flexibility is total. The `source` parameter simply passes a string to your `TranslationLoader`. You are free to provide a local path, a URL, or even a database identifier (e.g., `supabase-table-admin`).

## Network Loading Indicator
When your users switch from one language to another, the library automatically downloads the new JSON files.  
You can listen to the `isTranslating` signal to display a spinner or disable your dropdown menu during this process.

```ts
import { Component, inject } from '@angular/core';
import { TranslationService } from '@jetonpeche/angular-translate';

@Component({
  selector: 'app-lang-selector',
  template: `
    @if(translate.isTranslating())
    {
      <div class="loader">
        Loading language...
      </div>
    }

    <button 
        [disabled]="translate.isTranslating()" 
        (click)="translate.use('es')">
        Switch to Spanish
    </button>
  `
})
export class LangSelectorComponent 
{
  translate = inject(TranslationService);
}
```

## Advanced Features

#### 1. Native Pluralization (CLDR Standard)
The library handles pluralization natively using the standard `Intl.PluralRules` API, without any third-party dependencies.  
It relies on international grammatical rules (Unicode CLDR). To use it, you must pass a parameter named `count` in your interpolation.  
The API evaluates this number and looks for one of the following subkeys: `zero`, `one`, `two`, `few`, `many`, or `other`.  
The `other` key is mandatory as a fallback.

```json
{
  "CART.ITEMS": {
    "zero": "Your cart is empty",
    "one": "1 item in the cart",
    "other": "{count} items in the cart"
  }
}
```
```html
<!-- The directive automatically detects the "count" parameter -->
<p>{{ 'CART.ITEMS' | translate:{ count: cart.length } }}</p>
```

>**Important note on grammatical rules:**  
The system strictly reads the `count` variable and applies grammatical (not mathematical) logic that varies by the active language:  
In French, both `0` and `1` are considered singular (so the `"one"` key is used).  
In English, `1` is singular (`"one"`), but `0` is plural (so the `"other"` key is used).  
The `"zero"` key will only trigger automatically for languages with a strict grammatical rule for zero (like Arabic or Latvian).  
Make sure to always provide at least the `"other"` key as a universal fallback.

### 2. Context (Gender, Role) & Combinations
In addition to plurals (`count`), the library supports conditional branching via the context keyword. This is very useful for handling user gender or role statuses.  
Even better: you can nest contexts and plurals infinitely!  

(Note: Always include an `"other"` key at each nesting level to guarantee a fallback).

```json
{
  "USER.ACTIVITY": {
    "male": {
      "one": "He published 1 article",
      "other": "He published {count} articles"
    },
    "female": {
      "one": "She published 1 article",
      "other": "She published {count} articles"
    },
    "other": {
      "other": "They published {count} articles"
    }
  }
}
```
```html
<!-- The system will first resolve the "female" context, then the "other" plural rule (because count=3) -->
<p>{{ 'USER.ACTIVITY' | translate:{ context: user.gender, count: 3 } }}</p>
```

### 3. Global Formatting per Language
Instead of repeating formatting options (like currencies) across all your HTML templates, you can set a global configuration per language upon initialization. The pipes will automatically use these options, cascading down to the `defaultLang` configuration if no specific config is found.

```ts
provideTranslation({
  defaultLang: 'en',
  formatConfig: {
    'fr': { number: { style: 'currency', currency: 'EUR' } },
    'en': { number: { style: 'currency', currency: 'USD' } }
  }
})
```

### 4. Custom Loader (Loading from DB / API)
By default, the library loads local JSON files via `HttpClient`. You can override this behavior to load your translations from Supabase, Firebase, or a GraphQL API by creating your own `TranslationLoader`.

```ts
import { TranslationLoader, provideTranslation } from '@jetonpeche/angular-translate';

@Service()
export class MyGraphQLLoader implements TranslationLoader 
{
  getTranslation(lang: string, source: string) 
  {
    // Return an Observable or a Promise with your dictionary
    return this.apollo.query({ ... }); 
  }
}
```

### 5. Missing Key Monitoring (Sentry, Datadog)
When a translation is missing, you can intercept the event to alert your team or send a log to Sentry.

```ts
import { MissingTranslationHandler, MissingTranslationEvent } from '@jetonpeche/angular-translate';

@Service()
export class MyMissingHandler implements MissingTranslationHandler 
{
  handle(event: MissingTranslationEvent): string
  {
    console.warn(`[SENTRY LOG] Missing key: ${event.key} in language ${event.currentLang}`);
    return `[${event.key}]`; // Value displayed on screen
  }
}
```

### 6. Micro-Frontends: Component Lazy-Loading
If you are building a large standalone component (e.g., a weather widget) that needs to load its own translation JSON right when it renders, you can call `loadScope` directly in its constructor. The internal cache guarantees that no HTTP requests will be duplicated if the component is instantiated multiple times.

```ts
@Component({
  selector: 'app-weather-widget',
  standalone: true,
  template: `<h1>{{ 'weather.TITLE' | translate }}</h1>`
})
export class WeatherWidgetComponent 
{
  constructor() 
  {
    // Automatically loads /i18n/weather/en.json
    inject(TranslationService).loadScope('weather', '/i18n/weather/');
  }
}
```

### 7. Automatic Page Title Translation (SEO)
The library provides a ready-to-use Title Strategy (`TranslateTitleStrategy`). It intercepts the `title` property of your Angular routes, translates it, and updates the browser tab automatically on every navigation and on every language change.

```ts
import { TitleStrategy, provideRouter, Routes } from '@angular/router';
import { TranslateTitleStrategy } from '@jetonpeche/angular-translate';

const routes: Routes = [
  // The 'PAGE.HOME_TITLE' key will be translated automatically!
  { path: 'home', component: HomeComponent, title: 'PAGE.HOME_TITLE' } 
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Overrides Angular's native strategy
    { provide: TitleStrategy, useClass: TranslateTitleStrategy }
  ]
};
```

### Declaration in app.config.ts
Simply pass your custom classes in the second parameter of the `provideTranslation` function.

```ts
import { provideTranslation } from '@jetonpeche/angular-translate';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTranslation(
      // 1st parameter: Core configuration
      { 
        defaultLang: 'en', 
        sources: ['/i18n/'] 
      }, 
      // 2nd parameter: Advanced feature options
      { 
        loader: MyGraphQLLoader,         
        missingHandler: MyMissingHandler 
      } 
    )
  ]
};
```

## Under the Hood (How it works)
To guarantee maximum performance and predictability, `@jetonpeche/angular-translate` relies on several advanced internal mechanisms.

### 1. HTTP Fetching & Remote Sources
The library uses Angular's native `HttpClient` to load translation files. By default, it looks in the local `/i18n/` folder, but fully supports **remote HTTPS endpoints**.  
You can load translations directly from a CMS, a CDN, or a custom backend:

```ts
provideTranslation({
  sources: [
    '/i18n/',  // Local source (loaded first)
    'https://api.my-cdn.com/translations/v1/' // Second remote source (merged on top)
  ]
})
```
>Note: The library automatically appends `[lang].json` to every source path.

### 2. Deep Merging & Fallback Chain
Whenever a new language is loaded, or when a lazy-loaded Scope is fetched, the library performs a strict **Deep Merge** of the JSON dictionaries.

This means you can have a base language file and a module-specific file, and the library will cleanly merge them in memory without overwriting unrelated keys.

If you define a fallback chain (`fallbackLang: ['en-US', 'en', 'fr']`), the library evaluates keys in the merged cache from top to bottom until a match is found.

### 3. Smart In-Memory Caching
Network requests are expensive. The library uses a reactive internal `Map-`based cache.

When you switch back to a previously loaded language, or if multiple components concurrently request the same lazy-loaded scope, the library instantly returns the cached dictionary. **No redundant HTTP requests are ever made**.

### 4. AST Caching for Ultra-Fast Interpolation
String interpolation (replacing `{name}` with a variable) generally relies on heavy Regex operations. Because translations are frequently evaluated inside Angular templates (running often during change detection cycles), Regex can cause serious performance bottlenecks.

To solve this, we implemented **Abstract Syntax Tree (AST) caching:**
- The first time a string is translated, the library parses it and breaks it down into an AST array of tokens.
- This array is cached in memory.
- Subsequent renders of the same string entirely bypass the Regex engine, using simple array concatenation instead.

### 5. Seamless SSR & Hydration (TransferState)
In an Angular Universal (SSR) context, fetching translation files on the server and then again on the client causes undesirable layout shifts (flickering).

This library natively integrates Angular's `TransferState`.

1. The server fetches the JSON via HTTP.
2. The server serializes the dictionary and embeds it directly into the generated HTML.
3. During hydration, the browser's `TranslationService` intercepts this embedded state and instantly populates its internal cache, completely bypassing `HttpClient` for the initial load.

### 6. Massive Files & Memory Safety
In large enterprise applications or SPAs meant to run 24/7 without refreshing (like interactive kiosks or terminals), managing memory and load times is critical. `@jetonpeche/angular-translate` is designed to guarantee a strictly controlled RAM footprint:

- **Massive Translation Files (Lazy-Loading)**: For dictionaries with tens of thousands of keys, the library features `Scope` loading. Instead of parsing a monstrous global file that would freeze the browser, developers break their translations into micro JSON files that are only loaded into RAM when opening specific modules.

- **Capped `Intl` Cache**: Native formatting instances (Dates and Numbers) are cached per language-and-options combination. In a real-world app, this represents only a dozen entries (a few bytes in memory).

- **Glass Ceiling on AST**: The interpolation cache (storing parsed parameterized sentences) has a strict safety limit (LRU concept). If it exceeds the defined threshold (1000 unique strings), the library automatically flushes the index to free up the Garbage Collector. This process is completely invisible to the user and prevents any long-term memory leaks.

## License
MIT