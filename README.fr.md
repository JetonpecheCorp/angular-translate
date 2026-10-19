# @jetonpeche/angular-translate

*[Read this documentation in English](README.md)*

Une bibliothèque de traduction i18n moderne, légère et **basée sur les Signals** pour les applications Angular 22+.   
Conçue dès le départ pour l'architecture Angular moderne, elle offre une **intégration SSR transparente (TransferState)**, un typage strict pour vos clés de traduction, et une mise en cache AST ultra-performante.

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
  - [1. Le Service de Traduction (Signals)](#1-le-service-de-traduction-signals)
  - [2. Pipes Autonomes (Standalone)](#2-pipes-autonomes-standalone)
  - [3. Directive Autonome (Standalone)](#3-directive-autonome-standalone)
  - [4. Texte de secours local (Inline Fallback)](#4-texte-de-secours-local-inline-fallback)
- [Typage Strict & CLI (Autocomplétion)](#typage-strict--cli-autocomplétion)
- [Linter i18n (Vérification des clés)](#linter-i18n-vérification-des-clés)
- [Tests Unitaires](#tests-unitaires)
- [Lazy-Loading (Traductions par Scope)](#lazy-loading-traductions-par-scope)
- [Sous le capot (Comment ça marche)](#sous-le-capot-comment-ça-marche)

## Fonctionnalités

- **Signals Intégrés** : Traductions entièrement réactives utilisant les Signals d'Angular. Aucun code standard RxJS n'est requis.   
- **Prêt pour le SSR (TransferState)** : Zéro scintillement ou double requête HTTP. Les traductions chargées sur le serveur sont directement injectées dans l'état du client.   
- **Typage Strict (Autocomplétion)** : Une CLI intégrée génère les définitions TypeScript à partir de vos fichiers JSON, offrant une autocomplétion parfaite de vos clés ET de vos paramètres.
- **Linter i18n** : Vérifiez l'intégrité de vos traductions et détectez les clés manquantes avant le déploiement.
- **Test-Friendly** : Fournisseur utilitaire inclus pour simuler les traductions dans vos tests unitaires instantanément.
- **Lazy-Loading (Scopes)** : Chargez des fichiers de traduction spécifiques uniquement lors de la navigation vers des modules de fonctionnalités.   
- **Mise en cache AST** : Analyse ultra-rapide de l'interpolation de chaînes de caractères avec mise en cache mémoire intégrée.   
- **Formatage Natif** : Inclut les pipes translateDate et translateNumber qui exploitent l'API native Intl.

## Installation

```bash
npm install @jetonpeche/angular-translate
```

## Configuration
Configurez la bibliothèque à la racine dans `app.config.ts`.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslation } from '@jetonpeche/angular-translate';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideTranslation({
      defaultLang: 'fr',
      fallbackLang: ['en'], // Chaîne de fallback prise en charge !
      sources: ['/i18n/'], // Chemin vers vos fichiers JSON
      autoDetect: true,
      persist: true
    })
  ]
};
```

## Utilisation

### 1. Le Service de Traduction (Signals)
Injectez le `TranslationService` pour accéder aux propriétés réactives et changer la langue active.   

```ts
import { Component, inject } from '@angular/core';
import { TranslationService } from '@jetonpeche/angular-translate';

@Component({
  selector: 'app-header',
  template: `
    <header [dir]="translate.dir()">
      <!-- currentLang() est un Signal -->
      <p>Langue actuelle : {{ translate.currentLang() }}</p>
      
      <button (click)="changeLang('fr')" (mouseenter)="translate.preload('fr')">
        Passer en Français
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

### 2. Pipes Autonomes (Standalone)
Traduisez facilement du texte, des dates et des nombres directement dans vos templates HTML.  
Tous les pipes sont réactifs et se mettent à jour automatiquement lorsque la langue change.   

```ts
import { TranslatePipe, TranslateDatePipe, TranslateNumberPipe } from '@jetonpeche/angular-translate';

@Component({
  standalone: true,
  imports: [TranslatePipe, TranslateDatePipe, TranslateNumberPipe],
  template: `
    <!-- Traduction basique -->
    <h1>{{ 'HOME.TITLE' | translate }}</h1>

    <!-- Interpolation -->
    <p>{{ 'HOME.WELCOME' | translate:{ name: 'Alice' } }}</p>

    <!-- Formatage natif des dates -->
    <p>Date : {{ user.birthDate | translateDate:{ dateStyle: 'full' } }}</p>

    <!-- Formatage natif des devises/nombres -->
    <p>Prix : {{ product.price | translateNumber:{ style: 'currency', currency: 'EUR' } }}</p>
  `
})
export class MyComponent {}
```

### 3. Directive Autonome (Standalone)
Pour les contenus HTML complexes ou les traductions devant être assainies pour des raisons de sécurité, utilisez la directive `translate`.   

```ts
import { TranslateDirective } from '@jetonpeche/angular-translate';

@Component({
  standalone: true,
  imports: [TranslateDirective],
  template: `
    <div [translate]="'HOME.DESCRIPTION'" [translateParams]="{ boldText: 'Génial' }">
      Texte de secours par défaut si la traduction est manquante.
    </div>
  `
})
export class MyComponent {}
```

### 4. Texte de secours local (Inline Fallback)
Vous pouvez fournir une clé de secours ou un texte brut en 3ème paramètre au cas où la traduction principale n'existerait pas.

```html
<!-- Si USER.PHONE n'existe pas, utilise la clé USER.PHONE_NOT_EXISTS -->
<p>{{ 'USER.PHONE' | translate: undefined : 'USER.PHONE_NOT_EXISTS' }}</p>

<!-- Vous pouvez aussi passer du texte brut -->
<p>{{ 'USER.PHONE' | translate: undefined : 'Aucun numéro...' }}</p>
```

## Typage Strict & CLI (Autocomplétion)
Ne vous trompez plus jamais en tapant une clé de traduction ! La CLI génère des définitions TypeScript strictes, avec **détection automatique des paramètres et de leurs types**.
Évitez d'oublier des traductions avant un déploiement en production ! La bibliothèque inclut un Linter qui compare toutes vos langues avec un fichier de référence.

```json
{
  "ACCOUNT.BALANCE": "Le solde de {name:string} est de {amount:number} au {date:Date}."
}
```

### Exécuter la CLI
Assurez-vous que vos fichiers de traduction JSON sont prêts (ex: `public/i18n/fr.json`) et lancez le script en prenant votre langue principale comme référence :

```bash
# Tout les cas possible
# Génération standard
npx angular-translate-cli -i public/i18n/fr.json -o src/translation-types.d.ts  

# Activer le Mode Watch (Recompilation automatique à chaque sauvegarde)
npx angular-translate-cli -i public/i18n/fr.json --watch

# Sortie par defaut src/translation-types.d.ts
npx angular-translate-cli public/i18n/en.json  

# Creation des dossiers s'ils n'existent pas
npx angular-translate-cli -i en.json -o src/dossier/existe/pas/translation-types.d.ts
```

*Remarque : Assurez-vous d'inclure le fichier généré `translation-types.d.ts` dans votre `tsconfig.app.json` ou de le lier via une directive triple-slash dans votre `main.ts`!*

Utilisable dans le `package.json` en tant que `scripts`

```json
"scripts": 
{
  "i18n": "angular-translate-cli -i public/i18n/fr.json"
}
```

## Linter i18n (Vérification des clés)
Évitez d'oublier des traductions avant un déploiement en production ! La bibliothèque inclut un Linter qui compare toutes vos langues.
Le Linter est également inclus dans `angular-translate-cli`, mais se base sur un fichier pour comparer.

```bash
# Vérifie l'intégrité de tous les fichiers JSON du dossier
npx angular-translate-check --dir public/i18n
```

## Tests Unitaires
Pour écrire des tests unitaires (Jest/Jasmine) sans déclencher de vraies requêtes HTTP, utilisez le fournisseur utilitaire `provideTranslationTesting`.

```ts
import { TestBed } from '@angular/core/testing';
import { provideTranslationTesting } from '@jetonpeche/angular-translate';

describe('HeaderComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Injecte un mock synchrone parfait
        provideTranslationTesting({
            'HOME.TITLE': 'Titre de test',
            'ACCOUNT.BALANCE': 'Solde: {amount}'
        })
      ]
    });
  });
});
```

## Lazy-Loading (Traductions par Scope)
Optimisez votre application en chargeant les traductions uniquement lorsqu'une route spécifique est consultée.

```ts
import { Routes } from '@angular/router';
import { provideTranslationScope } from '@jetonpeche/angular-translate';

export const routes: Routes = [
  {
    path: 'admin',
    // Récupère automatiquement '/i18n/admin/en.json' lors de la visite de cette route
    providers: [provideTranslationScope('admin', '/i18n/admin/')],
    loadComponent: () => import('./admin/admin.component')
  }
];
```

## Sous le capot (Comment ça marche)
Pour garantir des performances et une prévisibilité maximales, `@jetonpeche/angular-translate` s'appuie sur plusieurs mécanismes internes avancés.

### 1. Récupération HTTP & Sources Distantes
La bibliothèque utilise le `HttpClient` natif d'Angular pour charger les fichiers de traduction. Par défaut, elle cherche dans le dossier local `/i18n/`, mais elle prend totalement en charge **les terminaux HTTPS distants**.  
Vous pouvez charger des traductions directement depuis un CMS, un CDN ou un backend personnalisé :

```ts
provideTranslation({
  sources: [
    '/assets/i18n/',  // Source locale (chargée en premier)
    'https://api.my-cdn.com/translations/v1/' // Seconde source distante (fusionnée par-dessus)
  ]
})
```
*Remarque : La bibliothèque ajoutera automatiquement `[lang].json` à chaque chemin source.*

### 2. Fusion Profonde (Deep Merging) & Chaîne de Fallback
Lorsqu'une nouvelle langue est chargée, ou lorsqu'un Scope en lazy-loading est récupéré, la bibliothèque effectue **une fusion profonde (Deep Merge)** stricte des dictionnaires JSON.  
Cela signifie que vous pouvez avoir un fichier de langue de base et un fichier de module spécifique, et la bibliothèque les fusionnera proprement en mémoire sans écraser les clés non liées.  
Si vous définissez une chaîne de fallback (`fallbackLang: ['fr-CA', 'fr', 'en']`), la bibliothèque évalue les clés dans le cache fusionné de haut en bas jusqu'à trouver une correspondance.

### 3. Mise en Cache Intelligente en Mémoire
Les requêtes réseau sont coûteuses. La bibliothèque utilise un cache interne réactif basé sur une `Map`.  
Lorsque vous revenez à une langue précédemment chargée, ou si plusieurs composants demandent simultanément le même scope en lazy-loading, la bibliothèque renvoie immédiatement le dictionnaire mis en cache. **Aucune requête HTTP redondante n'est jamais effectuée**.

### 4. Mise en cache AST pour une Interpolation Ultra-Rapide
L'interpolation de chaînes (le remplacement de `{name}` par une variable) repose généralement sur des opérations Regex lourdes. Comme les traductions sont souvent évaluées à l'intérieur des templates Angular (qui s'exécutent fréquemment lors de la détection de changements), les Regex peuvent causer des goulots d'étranglement au niveau des performances.  
Pour résoudre ce problème, nous avons implémenté **la mise en cache AST (Abstract Syntax Tree)**:

- La première fois qu'une chaîne est traduite, la bibliothèque l'analyse et la décompose en un tableau de jetons (tokens) AST.
- Ce tableau est mis en cache.   
- Les rendus ultérieurs de la même chaîne contournent entièrement le moteur Regex, en utilisant une simple concaténation de tableaux.   

### 5. SSR Transparent & Hydratation (TransferState)
Dans un contexte Angular Universal (SSR), récupérer les fichiers de traduction sur le serveur puis à nouveau sur le client provoque un décalage de mise en page indésirable (scintillement).  
Cette bibliothèque intègre nativement le `TransferState` d'Angular.   

1. Le serveur récupère le JSON via HTTP.   
2. Le serveur sérialise le dictionnaire et l'intègre directement dans le HTML généré.   
3. Lors de l'hydratation, le `TranslationService` du navigateur intercepte cet état intégré et remplit immédiatement son cache interne, contournant totalement le `HttpClient` pour le chargement initial.   

## Licence
MIT
