import { TranslationDictionary } from "../tokens/translation";

export function resolveKey(dictionnaire: TranslationDictionary | undefined, cle: string)
{
    if(!dictionnaire || !cle || cle.trim().length == 0)
        return undefined;

    if (dictionnaire[cle] != undefined)
        return dictionnaire[cle];

    if (!cle.includes('.'))
        return undefined;

    let listeElementCle = cle.split('.');
    let current: any = dictionnaire;

    for (const element of listeElementCle) 
    {
        if(typeof current != "object" || current == null)
            return undefined;

        current = current[element];
    }

    return current;
}