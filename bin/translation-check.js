#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let dirParam = '';

// Analyse des arguments
for (let i = 0; i < args.length; i++)
{
    if (args[i] === '--dir' || args[i] === '-d')
    {
        dirParam = args[i + 1];
        i++;
    } 
    else if (!dirParam && !args[i].startsWith('-'))
    {
        dirParam = args[i];
    }
}

if (!dirParam)
{
    console.error("❌ Please specify the folder containing your JSON files : npx angular-translate-check --dir public/i18n");
    process.exit(1);
}

const dirPath = path.resolve(process.cwd(), dirParam);

if (!fs.existsSync(dirPath))
{
    console.error(`❌ File not found: ${dirPath}`);
    process.exit(1);
}

const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));

if (files.length < 2)
{
    console.warn("⚠️ You need at least 2 JSON files in the folder to perform a comparison.");
    process.exit(0);
}

// Fonction d'extraction des clés
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

const fileKeysMap = new Map();
const allKeysSet = new Set();

// Lecture de tous les fichiers
for (const file of files)
{
    const filePath = path.join(dirPath, file);
    try
    {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const keys = extractKeys(content);
        fileKeysMap.set(file, keys);
        keys.forEach(k => allKeysSet.add(k));
    } 
    catch (e)
    {
        console.error(`❌ Error reading file ${file} :`, e.message);
    }
}

// Comparaison et affichage
let hasErrors = false;
console.log(`\n🔍 Scanning ${files.length} files in "${dirParam}"...\n`);

for (const [file, keys] of fileKeysMap.entries())
{
    const missingKeys = [];
    for (const globalKey of allKeysSet)
    {
        if (!keys.includes(globalKey))
        {
            missingKeys.push(globalKey);
        }
    }

    if (missingKeys.length > 0)
    {
        hasErrors = true;
        console.log(`⚠️  ${file}: ${missingKeys.length} key(s) missing(s)`);
        missingKeys.forEach(k => console.log(`   - ${k}`));
        console.log('');
    } 
    else
    {
        console.log(`✅ ${file} : 100% up to date.`);
    }
}

if (hasErrors)
{
    console.log("❌ i18n scan failed: keys are missing.");
    process.exit(1);
} 
else
{
    console.log("\n🎉 Success: All translation files are perfectly synchronized!");
}