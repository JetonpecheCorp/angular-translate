#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const packageName = '@jetonpeche/angular-translate';

// 1. Analyse des arguments
const args = process.argv.slice(2);
let inputParam = '';
let outputParam = 'src/translation-types.d.ts';
let watchMode = false;

for (let i = 0; i < args.length; i++)
{
    if (args[i] === '--input' || args[i] === '-i')
    {
        inputParam = args[i + 1];
        i++;
    } else if (args[i] === '--output' || args[i] === '-o')
    {
        outputParam = args[i + 1];
        i++;
    } else if (args[i] === '--watch' || args[i] === '-w')
    {
        watchMode = true;
    } else if (!inputParam && !args[i].startsWith('-'))
    {
        inputParam = args[i];
    }
}

if (!inputParam)
{
    console.error("❌ Veuillez spécifier le fichier source de référence : npx angular-translate-cli -i src/assets/i18n/fr.json");
    process.exit(1);
}

const jsonPath = path.resolve(process.cwd(), inputParam);
const outputPath = path.resolve(process.cwd(), outputParam);
const i18nDir = path.dirname(jsonPath);

// Extraction complète (avec types) pour le fichier de référence
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
                const paramType = rawType ? rawType.split('|').map(t =>
                {
                    const trimmed = t.trim();
                    switch (trimmed.toLowerCase())
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

// Extraction simple (uniquement les clés) pour les autres fichiers
function extractKeysOnly(obj, prefix = '')
{
    let keys = [];
    for (const key in obj)
    {
        const pathStr = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (typeof value === 'object' && value !== null && !('other' in value))
        {
            keys = keys.concat(extractKeysOnly(value, pathStr));
        } else
        {
            keys.push(pathStr);
        }
    }
    return keys;
}

// La fonction magique qui fait tout
function generateAndCheck()
{
    console.clear();
    const time = new Date().toLocaleTimeString();
    console.log(`\n⏳ [${time}] Compilation et analyse i18n...`);

    if (!fs.existsSync(jsonPath))
    {
        console.error(`❌ Fichier de référence introuvable : ${jsonPath}`);
        return;
    }

    // --- 1. GÉNÉRATION DES TYPES ---
    let dictionnaire;
    try
    {
        dictionnaire = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (error)
    {
        console.error("❌ Erreur de lecture du JSON de référence :", error.message);
        return;
    }

    const allItems = extractKeysAndValues(dictionnaire);
    const referenceKeys = allItems.map(i => i.key); // La liste absolue des clés

    const interfaceProps = allItems.map(item => `        /** ${item.value} */\n        "${item.key}": string;`).join('\n');
    const paramsProps = allItems.map(item =>
    {
        const paramNames = Object.keys(item.params);
        if (paramNames.length === 0) return `        "${item.key}": undefined;`;
        const props = paramNames.map(p => `${p}: ${item.params[p]}`).join(', ');
        return `        "${item.key}": { ${props} };`;
    }).join('\n');

    const dtsContent = `// Fichier généré automatiquement - NE PAS MODIFIER MANUELLEMENT\nimport '${packageName}';\n\ndeclare module '${packageName}' {\n    export interface TranslationSchema {\n${interfaceProps}\n    }\n    export interface TranslationParams {\n${paramsProps}\n    }\n}\n`;

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, dtsContent);

    console.log(`✅ Typage généré (${referenceKeys.length} clés) dans ${outputParam}`);

    // --- 2. VÉRIFICATION DES AUTRES LANGUES ---
    const otherFiles = fs.readdirSync(i18nDir).filter(f => f.endsWith('.json') && path.join(i18nDir, f) !== jsonPath);

    if (otherFiles.length > 0)
    {
        console.log(`\n🔍 Synchronisation par rapport à "${path.basename(jsonPath)}" :`);

        for (const file of otherFiles)
        {
            try
            {
                const content = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf-8'));
                const fileKeys = extractKeysOnly(content);

                const missing = referenceKeys.filter(k => !fileKeys.includes(k));
                const extra = fileKeys.filter(k => !referenceKeys.includes(k));

                if (missing.length === 0 && extra.length === 0)
                {
                    console.log(`  🟢 ${file} : 100% à jour.`);
                } 
                else
                {
                    console.log(`  🔴 ${file} :`);
                    if (missing.length > 0) console.log(`     ❌ Manque ${missing.length} clé(s) (ex: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''})`);
                    if (extra.length > 0) console.log(`     🗑️  Contient ${extra.length} clé(s) obsolète(s) (ex: ${extra.slice(0, 3).join(', ')}${extra.length > 3 ? '...' : ''})`);
                }
            } catch (e)
            {
                console.log(`  ⚠️  ${file} : Erreur de lecture JSON.`);
            }
        }
    }
    console.log('--------------------------------------------------');
}

// 1er lancement initial
generateAndCheck();

// Mode Watch (Écoute TOUT LE DOSSIER i18n)
if (watchMode)
{
    console.log(`👀 Mode Watch activé. En écoute sur le dossier : ${i18nDir}`);
    let debounceTimer;

    fs.watch(i18nDir, (eventType, filename) =>
    {
        if (filename && filename.endsWith('.json'))
        {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() =>
            {
                generateAndCheck();
            }, 150); // Léger délai pour la sauvegarde complète du fichier
        }
    });
}