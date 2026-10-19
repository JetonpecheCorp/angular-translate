#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const packageName = '@jetonpeche/angular-translate';

// 1. Analyse des arguments de la ligne de commande
const args = process.argv.slice(2);
let inputParam = '';
let outputParam = 'src/translation-types.d.ts'; // Valeur par défaut

for (let i = 0; i < args.length; i++)
{
    if (args[i] === '--input' || args[i] === '-i')
    {
        inputParam = args[i + 1];
        i++; // On saute la valeur pour le prochain tour
    }
    else if (args[i] === '--output' || args[i] === '-o')
    {
        outputParam = args[i + 1];
        i++;
    }
    // si on tape juste : npx angular-translate-cli my-file.json
    else if (!inputParam && !args[i].startsWith('-'))
    {
        inputParam = args[i];
    }
}

if (!inputParam)
{
    console.error("❌ Please specify the source file : npx angular-translate-cli --input src/public/i18n/en.json");
    process.exit(1);
}

// 2. Vérification du fichier d'entrée
const jsonPath = path.resolve(process.cwd(), inputParam);
if (!fs.existsSync(jsonPath))
{
    console.error(`❌ File not found: ${jsonPath}`);
    process.exit(1);
}

if (path.extname(jsonPath).toLowerCase() !== '.json')
{
    console.error("❌ Only .json files are supported for generating types.");
    process.exit(1);
}

// 3. Lecture du JSON
let dictionnaire;
try
{
    dictionnaire = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
} catch (error)
{
    console.error("❌ Error reading JSON:", error.message);
    process.exit(1);
}

// 4. Extraction des clés et valeurs
function extractKeysAndValues(obj, prefix = '')
{
    let items = [];
    for (const key in obj)
    {
        const pathStr = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null && !('other' in value))
        {
            // C'est un objet imbriqué normal
            items = items.concat(extractKeysAndValues(value, pathStr));
        }
        else
        {
            // C'est une valeur finale (string) ou une règle de pluriel (objet avec 'other')
            let displayValue = typeof value === 'object' ? JSON.stringify(value) : value;

            // On nettoie la valeur pour éviter de casser le formatage JSDoc
            displayValue = displayValue.replace(/\*\//g, '* /').replace(/\n/g, ' ');

            items.push({ key: pathStr, value: displayValue });
        }
    }

    return items;
}

const allKeys = extractKeysAndValues(dictionnaire);
const interfaceProps = allItems.map(item =>
{
    return `        /** ${item.value} */\n        "${item.key}": string;`;
}).join('\n');

const dtsContent = `// Automatically generated file - DO NOT EDIT MANUALLY
import '${packageName}';

declare module '${packageName}' {
    export interface TranslationSchema {
${interfaceProps}
    }
}
`;

// 5. Écriture du fichier de sortie
const outputPath = path.resolve(process.cwd(), outputParam);

// Création du dossier de destination s'il n'existe pas (ex: si on spécifie un dossier distant)
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir))
{
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, dtsContent);

console.log(`✅ [angular-translate] Successfully generated typing in ${outputParam} ! (${allKeys.length} keys)`);