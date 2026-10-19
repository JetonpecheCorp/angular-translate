#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const packageName = '@jetonpeche/angular-translate';

// 1. Analyse des arguments de la ligne de commande
const args = process.argv.slice(2);
let inputParam = '';
let outputParam = 'src/translation-types.d.ts';

for (let i = 0; i < args.length; i++)
{
    if (args[i] === '--input' || args[i] === '-i')
    {
        inputParam = args[i + 1];
        i++;
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
}
catch (error)
{
    console.error("❌ Error reading JSON:", error.message);
    process.exit(1);
}

// 4. Extraction des clés, des valeurs ET des paramètres typés
function extractKeysAndValues(obj, prefix = '')
{
    let items = [];
    for (const key in obj)
    {
        const pathStr = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null && !('other' in value))
        {
            items = items.concat(extractKeysAndValues(value, pathStr));
        } else
        {
            let displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
            displayValue = displayValue.replace(/\*\//g, '* /').replace(/\n/g, ' ');

            let paramsMap = {};
            const regex = /\{([a-zA-Z0-9_]+)(?::([a-zA-Z0-9_ |\[\]]+))?\}/g;
            let match;

            while ((match = regex.exec(displayValue)) !== null)
            {
                const paramName = match[1];
                const rawType = match[2];

                // Normalisation du type (gestion des pipes et de la casse)
                const paramType = rawType ? rawType.split('|').map(t =>
                {
                    const trimmed = t.trim();
                    const lower = trimmed.toLowerCase();

                    switch (lower)
                    {
                        case 'string': return 'string';
                        case 'number': return 'number';
                        case 'boolean': return 'boolean';
                        case 'date': return 'Date';
                        case 'any': return 'any';
                        default: return trimmed;
                    }
                }).join(' | ') : 'string';

                paramsMap[paramName] = paramType;
            }

            items.push({ key: pathStr, value: displayValue, params: paramsMap });
        }
    }

    return items;
}

const allItems = extractKeysAndValues(dictionnaire);

// Génération de l'interface des CLÉS
const interfaceProps = allItems.map(item =>
{
    return `        /** ${item.value} */\n        "${item.key}": string;`;
}).join('\n');

// Génération de l'interface des PARAMÈTRES
const paramsProps = allItems.map(item =>
{
    const paramNames = Object.keys(item.params);
    if (paramNames.length === 0)
    {
        return `        "${item.key}": undefined;`;
    }
    else
    {
        // Crée l'objet de type : { name: string, amount: number }
        const props = paramNames.map(p => `${p}: ${item.params[p]}`).join(', ');
        return `        "${item.key}": { ${props} };`;
    }
}).join('\n');

const dtsContent = `// Fichier généré automatiquement - NE PAS MODIFIER MANUELLEMENT
import '${packageName}';

declare module '${packageName}' {
    export interface TranslationSchema {
${interfaceProps}
    }
    
    // Mapping strict des paramètres
    export interface TranslationParams {
${paramsProps}
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

console.log(`✅ [angular-translate] Successfully generated typing in ${outputParam} ! (${interfaceProps.length} keys)`);