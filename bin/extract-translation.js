#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let jsonParam = '';
let srcParam = 'src/';
let autoAdd = false;
let defaultValue = 'NOT_TRANSLATE_VALUE';

// 1. Analyse des arguments
for (let i = 0; i < args.length; i++)
{
    if (args[i] === '--json' || args[i] === '-j')
    {
        jsonParam = args[i + 1]; 
        i++;
    } 
    else if (args[i] === '--src' || args[i] === '-s')
    {
        srcParam = args[i + 1]; 
        i++;
    } 
    else if (args[i] === '--add')
    {
        autoAdd = true;
    } 
    else if (args[i] === '--value' || args[i] === '-v')
    {
        defaultValue = args[i + 1]; 
        i++;
    } 
    else if (!jsonParam && !args[i].startsWith('-'))
    {
        jsonParam = args[i];
    }
}

if (!jsonParam)
{
    console.error("❌ Specify the reference JSON file: npx angular-translate-extract -j public/i18n/fr.json");
    process.exit(1);
}

const jsonPath = path.resolve(process.cwd(), jsonParam);
const srcPath = path.resolve(process.cwd(), srcParam);

if (!fs.existsSync(jsonPath))
{
    console.error(`❌ JSON file not found: ${jsonPath}`);
    process.exit(1);
}

// 2. Fonctions utilitaires JSON
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

function setDeepValue(obj, pathStr, value)
{
    const parts = pathStr.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++)
    {
        if (!current[parts[i]]) 
            current[parts[i]] = {};

        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

// 3. Scan des fichiers du projet
function walkDir(dir, callback)
{
    fs.readdirSync(dir).forEach(f =>
    {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

console.log(`\n🔍 Scanning the source code in "${srcParam}"...`);

const usedKeys = new Set();
// Regex pour capter : 'MA_CLE' | translate  ET  translate.instant('MA_CLE') ET t('MA_CLE')
const regexes = [
    /['"`]([A-Z0-9_.-]+)['"`]\s*\|\s*translate/g,
    /(?:instant|translateSignal)\s*\(\s*['"`]([A-Z0-9_.-]+)['"`]/g,
    /\bt\s*\(\s*['"`]([A-Z0-9_.-]+)['"`]/g // Pour la directive *translateGroup="let t"
];

walkDir(srcPath, (filePath) =>
{
    if (filePath.endsWith('.html') || filePath.endsWith('.ts'))
    {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const regex of regexes)
        {
            let match;
            while ((match = regex.exec(content)) !== null)
            {
                usedKeys.add(match[1]);
            }
        }
    }
});

// 4. Comparaison
const dictionnaire = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const existingKeys = extractKeys(dictionnaire);

const missingKeys = [...usedKeys].filter(k => !existingKeys.includes(k));

if (missingKeys.length === 0)
{
    console.log("✅ All keys used in the code exist in the JSON.");
    process.exit(0);
}

console.log(`⚠️  ${missingKeys.length} key(s) found(s) in code but missing(s) from JSON:`);
missingKeys.forEach(k => console.log(`   - ${k}`));

// 5. Ajout auto (si flag --add)
if (autoAdd)
{
    console.log(`\n➕ Automatic addition of missing keys with value "${defaultValue}"...`);
    missingKeys.forEach(k => setDeepValue(dictionnaire, k, defaultValue));

    fs.writeFileSync(jsonPath, JSON.stringify(dictionnaire, null, 2) + '\n', 'utf-8');
    console.log(`✅ ${jsonParam} file successfully updated!`);
} else
{
    console.log(`\n💡 Tip: Run the command with "--add" to insert them automatically.`);
}