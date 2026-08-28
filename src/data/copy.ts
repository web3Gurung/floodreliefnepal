import { en } from './site';
import { np } from './site.np';

export type Lang = 'en' | 'ne';

/** Pages live at `/` and `/np/`, so the path decides the language. */
export function langFromPath(pathname: string): Lang {
	return pathname.startsWith('/np') ? 'ne' : 'en';
}

export function copyFor(lang: Lang) {
	return lang === 'ne' ? np : en;
}

export function copyForPath(pathname: string) {
	return copyFor(langFromPath(pathname));
}
