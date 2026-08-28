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

/** Split copy so known names can be marked in the page without putting HTML in the strings. */
export function splitBy(text: string, needles: readonly string[]) {
	const pattern = new RegExp(
		`(${needles.map((needle) => needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
		'g',
	);

	return text.split(pattern).flatMap((part) =>
		part === '' ? [] : [{ text: part, hit: needles.includes(part) }],
	);
}
