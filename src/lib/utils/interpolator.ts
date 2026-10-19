import { TranslationValue } from "../tokens/translation";

const astCache = new Map<string, string[]>();

export function interpolate(
    value: TranslationValue | undefined,
    params: Record<string, any> | undefined,
    lang: string
): string | undefined
{
    if (value == undefined) 
        return undefined;

    let texte: any = "";
    if (typeof value === "string")
    {
        texte = value;
    } 
    else if ("other" in value)
    {
        const countValue = params?.["count"];
        const nbParametre = countValue !== undefined && countValue !== null ? Number(countValue) : 0;
        const regleGrammaire = new Intl.PluralRules(lang).select(nbParametre);
        texte = value[regleGrammaire] ?? value["other"];
    } 
    else
    {
        return undefined;
    }

    if (!params) return texte;

    // 1. AST CACHING : On vérifie si la phrase a déjà été découpée
    let tokens = astCache.get(texte);
    if (!tokens)
    {
        // La regex split va diviser la phrase et ignorer la déclaration de type.
        // Ex: "Bonjour {name:string}" devient ["Bonjour ", "name", ""]
        // Les index pairs (0, 2, 4...) sont du texte, les index impairs (1, 3, 5...) sont des variables.
        tokens = texte.split(/\{([a-zA-Z0-9_]+)(?::[^\}]+)?\}/g);
        astCache.set(texte, tokens as string[]);
    }

    // 2. RECONSTRUCTION RAPIDE (Concaténation sans Regex)
    let result = "";
    for (let i = 0; i < (tokens as string[]).length; i++)
    {
        // Texte statique
        if (i % 2 == 0)
            result += (tokens as string[])[i]; 
        else
        {
            const key = (tokens as string[])[i]; // Nom de la variable
            const val = params[key];

            if (val == undefined || val == null)
            {
                // Si la variable est manquante, on affiche l'accolade sans le type
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