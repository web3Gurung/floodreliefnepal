import { en } from './site';
import { np } from './site.np';
import { zh } from './site.zh';

export type Lang = 'en' | 'ne' | 'zh';

/** Pages live at `/`, `/np/`, and `/zh/`, so the path decides the language. */
export function langFromPath(pathname: string): Lang {
	if (pathname.startsWith('/zh')) return 'zh';
	if (pathname.startsWith('/np')) return 'ne';
	return 'en';
}

export function copyFor(lang: Lang) {
	if (lang === 'ne') return np;
	if (lang === 'zh') return zh;
	return en;
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

/**
 * Fills `{name}` slots in a copy string. Word order differs between English and
 * Nepali, so templates carry named slots rather than before and after fragments.
 */
export function fill(template: string, values: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}
