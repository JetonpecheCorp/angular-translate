import { TranslationDictionary } from "../tokens/translation";

export function deepMerge(...listeDictionnaireTraduction: TranslationDictionary[]): TranslationDictionary
{
    let retour: Record<string, any> = {};

    for (const dictionnaire of listeDictionnaireTraduction) 
    {
        if(!dictionnaire)
            continue;

        for (const key of Object.keys(dictionnaire)) 
        {   
            const SOURCE = retour[key];
            const CIBLE = dictionnaire[key];

            if(
                SOURCE != null && typeof SOURCE == "object" && !Array.isArray(SOURCE) && 
                CIBLE != null && typeof CIBLE == "object" && !Array.isArray(CIBLE)
            )
            {
                retour[key] = deepMerge(SOURCE, CIBLE as any);
            }
            
            else
                retour[key] = CIBLE;
        }
    }

    return retour;
}