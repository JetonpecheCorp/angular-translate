# @jetonpeche/angular-translate

[Documentation en français](https://github.com/JetonpecheCorp/angular-translate/blob/main/README.fr.md)

A modern, lightweight, and **Signal-based** i18n translation library for Angular 22+ applications.   
Built from the ground up for modern Angular architecture, it features seamless **SSR integration (TransferState)**, strict typing for your translation keys, and high-performance AST caching.

## Features

- **Signals Built-In**: Fully reactive translations using Angular Signals. No RxJS boilerplate required.
- **SSR Ready (TransferState)**: Zero flickering or double HTTP requests. Translations loaded on the server are directly injected into the client state.
- **Strict Typing (Autocomplete)**: A built-in CLI generates TypeScript definitions from your JSON files, providing perfect IDE autocomplete for your translation keys.
- **Lazy-Loading (Scopes)**: Load specific translation files only when navigating to feature modules or lazy-loaded routes.
- **AST Caching**: Extremely fast string interpolation parsing with built-in memory caching.
- **Native Formatting**: Includes `translateDate` and `translateNumber` pipes leveraging the native `Intl` API for flawless localization.

## Installation

```bash
npm install @jetonpeche/angular-translate
```

## Configuration

Set up the library in your root `app.config.ts`.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslation } from '@jetonpeche/angular-translate';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTranslation({
      defaultLang: 'en',
      fallbackLang: ['en'], // Fallback chain supported!
      sources: ['/i18n/'], // Path to your JSON files
      autoDetect: true,
      persist: true
    })
  ]
};
```

## Usage

### 1. The Translation Service (Signals)

Inject the `TranslationService` to access reactive properties and change the active language.

```ts
import { Component, inject } from '@angular/core';
import { TranslationService } from '@jetonpeche/angular-translate';

@Component({
  selector: 'app-header',
  template: `
    <header [dir]="translate.dir()">
      <!-- currentLang() is a Signal -->
      <p>Current Language: {{ translate.currentLang() }}</p>
      
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

Easily translate text, dates, and numbers directly in your HTML templates. All pipes are reactive and update automatically when the language changes.

```ts
import { TranslatePipe, TranslateDatePipe, TranslateNumberPipe } from '@jetonpeche/angular-translate';

@Component({
  standalone: true,
  imports: [TranslatePipe, TranslateDatePipe, TranslateNumberPipe],
  template: `
    <!-- Basic Translation -->
    <h1>{{ 'HOME.TITLE' | translate }}</h1>

    <!-- Interpolation -->
    <p>{{ 'HOME.WELCOME' | translate:{ name: 'Alice' } }}</p>

    <!-- Native Date Formatting -->
    <p>Date: {{ user.birthDate | translateDate:{ dateStyle: 'full' } }}</p>

    <!-- Native Currency/Number Formatting -->
    <p>Price: {{ product.price | translateNumber:{ style: 'currency', currency: 'EUR' } }}</p>
  `
})
export class MyComponent {}
```

### 3. Standalone Directive

For complex HTML content or security-sanitized translations, use the `translate` directive.

```ts
import { TranslateDirective } from '@jetonpeche/angular-translate';

@Component({
  standalone: true,
  imports: [TranslateDirective],
  template: `
    <div [translate]="'HOME.DESCRIPTION'" [translateParams]="{ boldText: 'Awesome' }">
      Default fallback text if translation is missing.
    </div>
  `
})
export class MyComponent {}
```

## Strict Typing & CLI (Autocomplete)

Never mistype a translation key again! The library includes a CLI tool to scan your JSON dictionaries and generate strict TypeScript definitions.

1. Ensure your JSON translation files are ready (e.g., `public/i18n/en.json`).
2. Run the CLI tool:

```bash
npx angular-translate-cli --input public/i18n/en.json --output src/translation-types.d.ts
```

*Note: Make sure to include the generated `translation-types.d.ts` file in your `tsconfig.app.json` or link it via a triple-slash directive in your `main.ts`!*

## Lazy-Loading (Scoped Translations)

Optimize your application by loading translations only when a specific route is accessed.

```ts
import { Routes } from '@angular/router';
import { provideTranslationScope } from '@jetonpeche/angular-translate';

export const routes: Routes = [
  {
    path: 'admin',
    // Automatically fetches '/i18n/admin/en.json' when visiting this route
    providers: [provideTranslationScope('admin', '/i18n/admin/')],
    loadComponent: () => import('./admin/admin.component')
  }
];
```

## Under the Hood (How it works)

To ensure maximum performance and predictability, `@jetonpeche/angular-translate` relies on several advanced internal mechanisms.

### 1. HTTP Fetching & Remote Sources
The library uses Angular's native `HttpClient` to load translation files. By default, it looks in the local `/i18n/` folder, but it fully supports **remote HTTPS endpoints**.  
You can load translations directly from a CMS, a CDN, or a custom backend:
```ts
provideTranslation({
  sources: [
    '/assets/i18n/',  // Local Source (first loaded)
    'https://api.my-cdn.com/translations/v1/' // Second remote source (fused on top)
  ]
})
```
*Note: The library will automatically append `[lang].json` to every source path.*

### 2. Deep Merging & Fallback Chain
When a new language is loaded, or when a Lazy-loaded Scope is fetched, the library performs a strict **Deep Merge** of the JSON dictionaries.  
This means you can have a base language file, and a specific module file, and the library will cleanly merge them in memory without overwriting unrelated keys.  
If you define a fallback chain (`fallbackLang: ['fr-CA', 'fr', 'en']`), the library evaluates keys across the merged cache from top to bottom until a match is found.

### 3. Intelligent In-Memory Caching
Network requests are expensive. The library uses a reactive internal `Map` cache.  
When you switch back to a previously loaded language, or if multiple components request the same lazy-loaded scope simultaneously, the library immediately returns the cached dictionary. **No redundant HTTP calls are ever made.**

### 4. AST Caching for Lightning-Fast Interpolation
String interpolation (replacing `{name}` with a variable) typically relies on heavy Regex operations. Since translations are often evaluated inside Angular templates (which run frequently during change detection), Regex can cause performance bottlenecks.  
To solve this, we implemented **AST Caching**:

- The first time a string is translated, the library parses it and breaks it down into an Abstract Syntax Tree (AST) token array.
- This array is cached.
- Subsequent renderings of the same string bypass the Regex engine entirely, using simple array concatenation.

### 5. Seamless SSR & Hydration (TransferState)
In an Angular Universal (SSR) context, fetching translation files on the server and then again on the client causes an unwanted layout shift (flickering).  
This library natively integrates Angular's `TransferState`.

1. The server fetches the JSON via HTTP.
2. The server serializes the dictionary and embeds it directly into the generated HTML.
3. Upon hydration, the browser's `TranslationService` intercepts this embedded state and populates its internal cache immediately, bypassing the `HttpClient` entirely for the initial load.

## License
MIT
