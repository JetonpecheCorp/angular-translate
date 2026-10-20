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
  - [4. Directive Structurelle (*translateGroup)](#4-directive-structurelle-translategroup)
  - [5. Texte de secours local (Inline Fallback)](#5-texte-de-secours-local-inline-fallback)
  - [6. Sécurité Mémoire & Prévention des Fuites (Memory Leaks)](#6-sécurité-mémoire--prévention-des-fuites-memory-leaks)
- [Typage Strict & CLI (Autocomplétion)](#typage-strict--cli-autocomplétion)
- [Linter i18n (Vérification des clés)](#linter-i18n-vérification-des-clés)
- [Extracteur de clés (Code => JSON)](#extracteur-de-clés-code--json)
- [Tests Unitaires](#tests-unitaires)
- [Lazy-Loading (Traductions par Scope)](#lazy-loading-traductions-par-scope)
- [Fonctionnalités Avancées](#fonctionnalités-avancées)
  - [1. Pluralisation Native (Norme CLDR)](#1-pluralisation-native-norme-cldr)
  - [2. Contexte (Genre, Rôle) & Combinaisons](#2-contexte-genre-rôle--combinaisons)
  - [3. Formatage Global par Langue](#3-formatage-global-par-langue)
  - [4. Custom Loader (Chargement depuis une base de données / API)](#4-custom-loader-chargement-depuis-une-base-de-données--api)
  - [5. Monitoring des clés manquantes (Sentry, Datadog)](#5-monitoring-des-clés-manquantes-sentry-datadog)
  - [6. Micro-Frontends : Lazy-Loading Composant](#6-micro-frontends--lazy-loading-composant)
  - [7. Traduction automatique des Titres de Page (SEO)](#7-traduction-automatique-des-titres-de-page-seo)
  - [Déclaration dans app.config.ts](#déclaration-dans-appconfigts)
- [Sous le capot (Comment ça marche)](#sous-le-capot-comment-ça-marche)

## Fonctionnalités

- **Signals Intégrés** : Traductions entièrement réactives utilisant les Signals d'Angular. Aucun code standard RxJS n'est requis.   
- **Prêt pour le SSR (TransferState)** : Zéro scintillement ou double requête HTTP. Les traductions chargées sur le serveur sont directement injectées dans l'état du client.   
- **Typage Strict (Autocomplétion)** : Une CLI intégrée génère les définitions TypeScript à partir de vos fichiers JSON, offrant une autocomplétion parfaite de vos clés ET de vos paramètres.
- **Linter & Extracteur i18n** : Vérifiez l'intégrité de vos traductions et extrayez automatiquement les nouvelles clés depuis votre code HTML/TS.
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
      persist: true,
      // (Optionnel) Configuration de formatage globale par langue
      formatConfig: {
        'fr': {
          number: { style: 'currency', currency: 'EUR' },
          date: { dateStyle: 'short' }
        },
        'en': {
          number: { style: 'currency', currency: 'USD' }
        }
      }
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

    <!-- Formatage natif des devises/nombres (les options sont facultatives si configurées dans app.config.ts) -->
    <p>Prix : {{ product.price | translateNumber }}</p>
  `
})
export class MyComponent {}
```

### 3. Directive Autonome (Standalone)
Pour les contenus HTML complexes devant être assainis contre les failles XSS, utilisez la directive `[translate]`.  
Elle utilise le `DomSanitizer` et injecte le résultat dans le `innerHTML`.

```ts
import { TranslateDirective } from '@jetonpeche/angular-translate';

@Component({
  standalone: true,
  imports: [TranslateDirective],
  template: `
    <div [translate]="'HOME.DESCRIPTION'" 
        [translateParams]="{ boldText: 'Génial' }"
        [translateFallback]="'HOME.NO_DESCRIPTION'">
    </div>
  `
})
export class MyComponent {}
```

### 4. Directive Structurelle (*translateGroup)
Lorsqu'un bloc HTML contient de nombreuses traductions, évitez de répéter le pipe `| translate` en utilisant la directive structurelle `*translateGroup`.

```html
<ng-container *translateGroup="let t">
   <h1>{{ t('HOME.TITLE') }}</h1>
   <p>{{ t('HOME.SUBTITLE', { name: 'Alice' }) }}</p>
   <button>{{ t('HOME.BTN') }}</button>
</ng-container>
```

### 5. Texte de secours local (Inline Fallback)
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

### Déclarer des types dans votre JSON
Dans vos fichiers JSON, vous pouvez typer vos variables avec la syntaxe `{variable:type}`. Si le type est omis, `string` est utilisé par défaut.

```json
{
  "ACCOUNT.BALANCE": "Le solde de {name:string} est de {amount:number} au {date:Date}."
}
```

### Exécuter la CLI
Assurez-vous que vos fichiers de traduction JSON sont prêts (ex: `public/i18n/fr.json`) et lancez le script en prenant votre langue principale comme référence :

| Parametre | Alias | Description | Defaut / Requis |
|:--- |:--- |:--- |:--- |
| `--input` | `-i` | Fichier JSON source servant de référence (ex: `fr.json`). | **Requis** |
| `--output` | `-o` | Chemin du fichier de déclaration TypeScript généré. | `src/translation-types.d.ts`|
| `--watch` | `-w` | Active l'écoute du dossier pour regénérer les types à chaque sauvegarde. | `false` |

```bash
# Génération standard
npx angular-translate-cli -i public/i18n/fr.json -o src/translation-types.d.ts  

# Activer le Mode Watch (Recompilation automatique à chaque sauvegarde)
npx angular-translate-cli -i public/i18n/fr.json --watch

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
Évitez d'oublier des traductions avant un déploiement ! La bibliothèque inclut un Linter qui compare toutes vos langues.

| Paramètre | Alias | Description | Défaut / Requis |
| :--- | :--- | :--- | :--- |
| `--dir` | `-d` | Dossier contenant l'ensemble de vos fichiers JSON de traduction. | **Requis** |

```bash
# Vérifie l'intégrité de tous les fichiers JSON du dossier
npx angular-translate-check --dir public/i18n
```
Le script renverra une erreur (code 1, idéal pour bloquer un pipeline CI/CD) s'il trouve des clés manquantes ou des clés obsolètes (mortes) dans les autres fichiers de langue.

## Extracteur de clés (Code => JSON)
Détectez automatiquement les nouvelles clés ajoutées dans votre code source (`.html` et `.ts`) et ajoutez-les à votre fichier JSON de référence.

| Paramètre | Alias | Description | Défaut / Requis |
| :--- | :--- | :--- | :--- |
| `--json` | `-j` | Fichier JSON de référence à vérifier ou mettre à jour. | **Requis** |
| `--src` | `-s` | Dossier contenant votre code source à analyser. | `src/` |
| `--add` | *(aucun)*| Insère automatiquement les clés trouvées dans le code mais absentes du JSON. | `false` |
| `--value`| `-v` | Valeur assignée aux nouvelles clés ajoutées (nécessite `--add`). | `NOT_TRANSLATE_VALUE` |

```bash
# Analyse le code et signale les clés non déclarées dans le JSON
npx angular-translate-extract -j public/i18n/fr.json -s src/

# Ajoute automatiquement les clés manquantes au JSON avec une valeur par défaut
npx angular-translate-extract -j public/i18n/fr.json -s src/ --add --value "NOT_TRANSLATE_VALUE"
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
Il arrive souvent qu'une application ait besoin d'une approche hybride : charger les traductions principales très rapidement via des fichiers JSON locaux, mais charger les traductions d'un module spécifique (comme un panneau d'administration) depuis une API distante ou une base de données.

`@jetonpeche/angular-translate` permet d'assigner un **Loader exclusif à un Scope particulier**. S'il est défini, ce chargeur surchargera le chargeur global uniquement pour ce module.

Dans cet exemple, au lieu de lire un fichier local, nous interrogeons une API REST. La propriété `source` n'est plus un chemin de dossier, mais l'URL de l'API.  
Passez simplement votre classe personnalisée dans la propriété `loader` de la configuration du scope.
```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslationLoader } from '@jetonpeche/angular-translate';

@Injectable()
export class AdminApiLoader implements TranslationLoader 
{
  private http = inject(HttpClient);

  getTranslation(lang: string, source: string) 
  {
    // source = "https://api.mon-backend.com/traductions/admin/"
    // On requête l'API distante au lieu d'un fichier JSON local
    return this.http.get(`${source}${lang}`);
  }
}

import { Routes } from '@angular/router';
import { provideTranslationScope } from '@jetonpeche/angular-translate';

export const routes: Routes = [
  {
    path: 'admin',
    // Récupère automatiquement '/i18n/admin/[lang].json' lors de la visite de cette route
    providers: [
      provideTranslationScope({ 
        scope: 'admin', 
        source: '/i18n/admin/', // L'URL passée au loader
        loader: AdminApiLoader // Surcharge le loader uniquement pour ce scope !
      })
    ],
    loadComponent: () => import('./admin/admin.component')
  }
];
```

>**Note** : La flexibilité est totale. Le paramètre `source` transmet simplement une chaîne de caractères à votre `TranslationLoader`. Vous êtes libre d'y mettre un chemin local, une URL, ou même un identifiant de base de données (ex: `supabase-table-admin`).

## Fonctionnalités Avancées

### 1. Pluralisation Native (Norme CLDR)
La bibliothèque gère la pluralisation de manière native grâce à l'API standard `Intl.PluralRules`, sans aucune dépendance tierce.  

Elle se base sur les règles grammaticales internationales (Unicode CLDR). Pour l'utiliser, vous **devez** obligatoirement passer un paramètre nommé `count` dans votre interpolation.  
L'API évaluera ce nombre et cherchera l'une des sous-clés suivantes : **`zero`, `one`, `two`, `few`, `many`, ou `other`**.  
La clé `other` est obligatoire en cas de repli.

```json
{
  "CART.ITEMS": {
    "zero": "Votre panier est vide",
    "one": "1 article dans le panier",
    "other": "{count} articles dans le panier"
  }
}
```
```html
<!-- La directive détecte automatiquement le paramètre "count" -->
<p>{{ 'CART.ITEMS' | translate:{ count: cart.length } }}</p>
```

> **Remarque importante sur les règles grammaticales :**
Le système lit exclusivement la variable `count` et applique une logique grammaticale (et non mathématique) qui varie selon la langue active :  
En Français, `0` et `1` sont tous les deux considérés comme singuliers. L'API ciblera donc la clé `"one"` pour 0 (ex: "0 article").  
En Anglais, `1` est singulier (`"one"`), mais `0` est pluriel. L'API ciblera donc la clé `"other"` pour 0 (ex: "0 items").  
La clé `"zero"` ne sera déclenchée automatiquement que pour les langues ayant une règle grammaticale stricte pour le zéro (comme l'arabe ou le letton).  
Assurez-vous de toujours fournir au minimum la clé `"other"`, qui sert de valeur par défaut universelle.  

### 2. Contexte (Genre, Rôle) & Combinaisons
En plus du pluriel (`count`), la bibliothèque gère la sélection conditionnelle via le mot-clé `context`. C'est très utile pour gérer le genre ou le statut d'un utilisateur.
Mieux encore : vous pouvez imbriquer le contexte et le pluriel de manière infinie !

(Note : Assurez-vous de toujours inclure une clé `"other"` à chaque niveau d'imbrication pour garantir le comportement de repli).

```json
{
  "USER.ACTIVITY": {
    "male": {
      "one": "Il a publié 1 article",
      "other": "Il a publié {count} articles"
    },
    "female": {
      "one": "Elle a publié 1 article",
      "other": "Elle a publié {count} articles"
    },
    "other": {
      "other": "Iel a publié {count} articles"
    }
  }
}
```
```html
<!-- Le système résoudra d'abord le contexte "female", puis cherchera la règle de pluriel "other" (car count=3) -->
<p>{{ 'USER.ACTIVITY' | translate:{ context: user.gender, count: 3 } }}</p>
```

### 3. Formatage Global par Langue
Au lieu de répéter les options de formatage (comme la devise) dans tous vos templates HTML, vous pouvez définir une configuration globale par langue lors de l'initialisation. Les pipes utiliseront automatiquement ces options, avec une logique de cascade vers la langue par défaut (`defaultLang`) si aucune configuration spécifique n'existe.

```ts
provideTranslation({
  defaultLang: 'fr',
  formatConfig: {
    'fr': { number: { style: 'currency', currency: 'EUR' } },
    'en': { number: { style: 'currency', currency: 'USD' } }
  }
})
```

### 4. Custom Loader (Chargement depuis une base de données / API)
Par défaut, la bibliothèque charge des fichiers JSON locaux via `HttpClient`. Vous pouvez surcharger ce comportement pour charger vos traductions depuis Supabase, Firebase, ou une API GraphQL en créant votre propre `TranslationLoader`.

```ts
import { TranslationLoader, provideTranslation } from '@jetonpeche/angular-translate';

@Service()
export class MyGraphQLLoader implements TranslationLoader 
{
  getTranslation(lang: string, source: string) 
  {
    // Retourne un Observable ou une Promise avec votre dictionnaire
    return this.apollo.query({ ... }); 
  }
}
```

### 5. Monitoring des clés manquantes (Sentry, Datadog)
Lorsqu'une traduction est introuvable, vous pouvez intercepter l'événement pour alerter votre équipe ou envoyer un log à Sentry.

```ts
import { MissingTranslationHandler, MissingTranslationEvent } from '@jetonpeche/angular-translate';

@Service()
export class MyMissingHandler implements MissingTranslationHandler 
{
  handle(event: MissingTranslationEvent): string
  {
    console.warn(`[SENTRY LOG] Clé manquante: ${event.key} en langue ${event.currentLang}`);
    return `[${event.key}]`; // Valeur affichée à l'écran
  }
}
```

### 6. Micro-Frontends : Lazy-Loading Composant
Si vous créez un gros composant autonome (ex: un widget météo) qui doit charger son propre fichier JSON de traduction au moment de son affichage, vous pouvez appeler `loadScope` directement dans son constructeur. Le cache interne garantit qu'aucune requête HTTP ne sera répétée si le composant est instancié plusieurs fois.

```ts
@Component({
  selector: 'app-widget-meteo',
  standalone: true,
  template: `<h1>{{ 'meteo.TITLE' | translate }}</h1>`
})
export class WidgetMeteoComponent 
{
  constructor() 
  {
    // Charge automatiquement /i18n/meteo/fr.json
    inject(TranslationService).loadScope('meteo', '/i18n/meteo/');
  }
}
```

### 7. Traduction automatique des Titres de Page (SEO)
La bibliothèque fournit une stratégie de titre (`TranslateTitleStrategy`) prête à l'emploi. Elle intercepte la propriété `title` de vos routes Angular, la traduit, et met à jour l'onglet du navigateur automatiquement à chaque navigation **et à chaque changement de langue**.

```ts
import { TitleStrategy, provideRouter, Routes } from '@angular/router';
import { TranslateTitleStrategy } from '@jetonpeche/angular-translate';

const routes: Routes = [
  // La clé 'PAGE.HOME_TITLE' sera traduite automatiquement !
  { path: 'home', component: HomeComponent, title: 'PAGE.HOME_TITLE' } 
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Surcharge la stratégie native d'Angular
    { provide: TitleStrategy, useClass: TranslateTitleStrategy }
  ]
};
```

### Déclaration dans app.config.ts
Passez simplement vos classes personnalisées dans le deuxième paramètre de la fonction `provideTranslation`.

```ts
import { provideTranslation } from '@jetonpeche/angular-translate';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTranslation(
      // 1er paramètre : La configuration classique
      { 
        defaultLang: 'fr', 
        sources: ['/i18n/'] 
      }, 
      // 2ème paramètre : Les options avancées
      { 
        loader: MyGraphQLLoader,         
        missingHandler: MyMissingHandler 
      } 
    )
  ]
};
```

## Sous le capot (Comment ça marche)
Pour garantir des performances et une prévisibilité maximales, `@jetonpeche/angular-translate` s'appuie sur plusieurs mécanismes internes avancés.

### 1. Récupération HTTP & Sources Distantes
La bibliothèque utilise le `HttpClient` natif d'Angular pour charger les fichiers de traduction. Par défaut, elle cherche dans le dossier local `/i18n/`, mais elle prend totalement en charge **les terminaux HTTPS distants**.  
Vous pouvez charger des traductions directement depuis un CMS, un CDN ou un backend personnalisé :

```ts
provideTranslation({
  sources: [
    '/i18n/',  // Source locale (chargée en premier)
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

### 6. Fichiers Gigantesques & Sécurité Mémoire
Dans les applications d'entreprise volumineuses ou les SPA destinées à tourner 24h/24 sans rafraîchissement (bornes interactives, terminaux), la gestion de la mémoire et des temps de chargement est critique. `@jetonpeche/angular-translate` a été conçu pour garantir une empreinte RAM parfaitement maîtrisée :

- **Fichiers de traduction massifs (Lazy-Loading)** : Pour les dictionnaires de plusieurs dizaines de milliers de clés, la bibliothèque intègre le chargement par `Scopes`. Au lieu de charger un fichier global monstrueux qui gèlerait le navigateur lors du parsing, les développeurs fragmentent leurs traductions en micro-fichiers JSON qui ne sont chargés en RAM qu'à l'ouverture des modules concernés.
- **Cache `Intl` limité** : Les instances de formatage natif (Dates et Nombres) sont mises en cache par combinaison de langue et d'options. Dans une application réelle, cela représente à peine une dizaine d'entrées (quelques octets en mémoire).
- **Plafond de verre sur l'AST** : Le cache d'interpolation (qui stocke les phrases paramétrées et découpées) possède une limite de sécurité stricte (LRU concept). S'il dépasse le seuil défini (1000 chaînes uniques), la bibliothèque purge automatiquement l'index pour libérer le Garbage Collector. Ce processus est totalement invisible pour l'utilisateur et empêche toute saturation de la mémoire sur le long terme.

## Licence
MIT
