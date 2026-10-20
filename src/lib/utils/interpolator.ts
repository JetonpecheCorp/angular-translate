import { TranslationValue } from "../tokens/translation";

const astCache = new Map<string, string[]>();
const MAX_CACHE_SIZE = 1000;

/**
 * Fonction récursive pour descendre dans un arbre JSON de traduction.
 * Elle permet de cumuler le Contexte (genre, rôle) ET le Pluriel.
 */
function resolveNode(node: any, params: Record<string, any> | undefined, lang: string): string | undefined
{
    // Condition de sortie : on a trouvé la chaîne finale
    if (typeof node === 'string') 
        return node;

    if (typeof node !== 'object' || node === null) 
        return undefined;

    // 1. Résolution par CONTEXTE (si le paramètre 'context' est passé)
    if (params?.['context'] !== undefined && node[params['context']] !== undefined)
    {
        const nextParams = { ...params };
        delete nextParams['context']; // On le retire pour éviter de boucler dessus
        return resolveNode(node[params['context']], nextParams, lang);
    }

    // 2. Résolution par PLURIEL (si le paramètre 'count' est passé)
    if (params?.['count'] !== undefined && params?.['count'] !== null)
    {
        const countValue = Number(params['count']);
        const rule = new Intl.PluralRules(lang).select(countValue);
        
        if (node[rule] !== undefined)
        {
            const nextParams = { ...params };
            delete nextParams['count']; // On le retire
            return resolveNode(node[rule], nextParams, lang);
        }
    }

    // 3. Valeur de REPLI "other"
    if (node['other'] !== undefined)
    {
        return resolveNode(node['other'], params, lang);
    }

    return undefined; // Échec de la résolution
}

export function interpolate(
    value: TranslationValue | undefined,
    params: Record<string, any> | undefined,
    lang: string
): string | undefined
{
    if (value == undefined) 
        return undefined;

    // Étape 1 : On parcourt l'objet JSON (Pluriel + Contexte) pour trouver le texte brut
    const texteBrut = resolveNode(value, params, lang);
    
    if (!texteBrut) 
        return undefined;

    // Si pas de paramètres, on renvoie directement le texte
    if (!params || Object.keys(params).length === 0) 
        return texteBrut;

    // Étape 2 : AST CACHING (Analyse de la chaîne)
    let tokens = astCache.get(texteBrut);
    if (!tokens)
    {
        if (astCache.size >= MAX_CACHE_SIZE)
            astCache.clear();

        // Sépare la chaîne des variables (ex: "Bonjour {name:string}")
        tokens = texteBrut.split(/\{([a-zA-Z0-9_]+)(?::[^\}]+)?\}/g);
        astCache.set(texteBrut, tokens as string[]);
    }

    // Étape 3 : RECONSTRUCTION RAPIDE
    let result = "";
    for (let i = 0; i < (tokens as string[]).length; i++)
    {
        if (i % 2 == 0)
        {
            result += (tokens as string[])[i]; 
        }
        else
        {
            const key = (tokens as string[])[i]; 
            const val = params[key];

            // Affiche {variable} si manquante
            if (val == undefined || val == null)
            {
                result += `{${key}}`;
            } 
            else if (val instanceof Date && !isNaN(val.getTime()))
            {
                result += new Intl.DateTimeFormat(lang).format(val);
            } 
            else if (typeof val == 'number')
            {
                result += new Intl.NumberFormat(lang).format(val);
            } 
            else
            {
                result += val;
            }
        }
    }

    return result;
}