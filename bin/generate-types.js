#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const packageName = '@jetonpeche/angular-translate';

const jsonParam = process.argv[2];
if (!jsonParam)
{
    console.error("❌ Veuillez spécifier le fichier source : npx angular-translate-cli /i18n/fr.json");
    process.exit(1);
}

const jsonPath = path.resolve(process.cwd(), jsonParam);
if (!fs.existsSync(jsonPath))
{
    console.error(`❌ Fichier introuvable : ${jsonPath}`);
    process.exit(1);
}

if (path.extname(jsonPath).toLowerCase() !== '.json')
{
    console.error("❌ Seuls les fichiers .json sont supportés pour la génération des types.");
    process.exit(1);
}

let dictionnaire;
try
{
    dictionnaire = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
} catch (error)
{
    console.error("❌ Erreur lors de la lecture du JSON :", error.message);
    process.exit(1);
}

function extractKeys(obj, prefix = '')
{
    let keys = [];
    for (const key in obj)
    {
        const pathStr = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null && !('other' in value))
        {
            keys = keys.concat(extractKeys(value, pathStr));
        } 
        else
        {
            keys.push(pathStr);
        }
    }
    return keys;
}

const allKeys = extractKeys(dictionnaire);

const interfaceProps = allKeys.map(k => `        "${k}": string;`).join('\n');
const dtsContent = `// Fichier généré automatiquement - NE PAS MODIFIER MANUELLEMENT
import '${packageName}';
declare module '${packageName}' {
    export interface TranslationSchema {
${interfaceProps}
    }
}
`;

const outputPath = path.resolve(process.cwd(), 'src/translation-types.d.ts');
fs.writeFileSync(outputPath, dtsContent);

console.log(`✅ [angular-translate] Typage généré avec succès ! (${allKeys.length} clés)`);