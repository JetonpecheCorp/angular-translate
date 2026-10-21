import { TranslationValue } from "../tokens/translation";

const astCache = new Map<string, string[]>();
const MAX_CACHE_SIZE = 1000;

function escapeRegExp(string: string): string 
{
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    lang: string,
    config?: { prefix: string, suffix: string }
): string | undefined
{
    if (value == undefined) return undefined;

    const texteBrut = resolveNode(value, params, lang);
    if (!texteBrut)
        return undefined;

    if (!params || Object.keys(params).length === 0)
        return texteBrut;

    const prefix = config?.prefix || '{';
    const suffix = config?.suffix || '}';

    let tokens = astCache.get(texteBrut);
    if (!tokens)
    {
        if (astCache.size >= MAX_CACHE_SIZE) astCache.clear();

        // Création de la regex dynamique (ex: /\{([a-zA-Z0-9_]+)(?::[^\}]+)?\}/g)
        const p = escapeRegExp(prefix);
        const s = escapeRegExp(suffix);
        const regex = new RegExp(`${p}([a-zA-Z0-9_]+)(?::[^${s}]+)?${s}`, 'g');

        tokens = texteBrut.split(regex);
        astCache.set(texteBrut, tokens as string[]);
    }

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

            if (val == undefined || val == null)
            {
                result += `${prefix}${key}${suffix}`;
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