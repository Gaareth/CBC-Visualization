import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(...inputs));
}

export function dedent(str: string) {
	const lines = str.replace(/^\n/, '').split('\n');
	const indent = Math.min(
		...lines.filter((l) => l.trim()).map((l) => (l.match(/^(\s*)/) || [''])[1].length)
	);
	return lines.map((l) => l.slice(indent)).join('\n');
}


export const SURFACE_LEVEL_BG_COLORS = [
	'bg-transparent',
	'dark:bg-surface-a10 bg-gray-50 dark:hover:bg-surface-a20 hover:bg-gray-100',
	'dark:bg-surface-a20 bg-gray-100 dark:hover:bg-surface-a30 hover:bg-gray-200',
	'dark:bg-surface-a30 bg-gray-200 dark:hover:bg-surface-a40 hover:bg-gray-300',
	'dark:bg-surface-a40 bg-gray-300 dark:hover:bg-surface-a50 hover:bg-gray-400',
	'dark:bg-surface-a50 bg-gray-400 dark:hover:bg-surface-a60 hover:bg-gray-500',
];