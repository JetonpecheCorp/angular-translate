import { isPlatformBrowser } from "@angular/common";
import { inject, PLATFORM_ID, Service } from "@angular/core";

@Service()
export class TranslationStorageService
{
    private readonly PLATFORM_ID = inject(PLATFORM_ID);

    private isPlatformBrowser(): boolean
    {
        return isPlatformBrowser(this.PLATFORM_ID);
    }

    get(key: string): string | null
    {
        try 
        {
            if(this.isPlatformBrowser())
                return localStorage.getItem(key);
            
            return null;
        } 
        catch (error) 
        {
            return null;
        }
    }

    set(key: string, value: string): void
    {
        try
        {
            if(this.isPlatformBrowser())
            {
                localStorage.setItem(key, value);
                return;
            }    
        } 
        catch (error) 
        {
            
        }
    }

    getBrowserlang(): string | null
    {
        try 
        {
            if(this.isPlatformBrowser() && navigator.language)
                return navigator.language.split('-')[0];

            return  null;   
        } 
        catch (error) 
        {
            return null;
        }
    }
}