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

export const surfaceOutline = {
	1: 'surface-outline-1',
	2: 'surface-outline-2',
	3: 'surface-outline-3',
	4: 'surface-outline-4',
	5: 'surface-outline-5'
} as const;

export const borderLayer = {
	0: 'border-layer-0',
	1: 'border-layer-1',
	2: 'border-layer-2',
	3: 'border-layer-3',
	4: 'border-layer-4',
	5: 'border-layer-5'
} as const;

export const inputLayer = {
	1: 'input-layer-1',
	2: 'input-layer-2',
	3: 'input-layer-3',
	4: 'input-layer-4',
	5: 'input-layer-5'
} as const;

export const bgSurface = {
	0: 'bg-surface-0',
	1: 'bg-surface-1',
	2: 'bg-surface-2',
	3: 'bg-surface-3',
	4: 'bg-surface-4',
	5: 'bg-surface-5'
} as const;

export const hoverBgSurface = {
	0: 'hover:bg-surface-0',
	1: 'hover:bg-surface-1',
	2: 'hover:bg-surface-2',
	3: 'hover:bg-surface-3',
	4: 'hover:bg-surface-4',
	5: 'hover:bg-surface-5'
} as const;

export type SurfaceLevel = keyof typeof surfaceOutline; // 1 | 2 | 3 | 4 | 5
export type BgSurfaceLevel = keyof typeof bgSurface; // 0 | 1 | 2 | 3 | 4 | 5

export const BLOCK_COLORS = {
	fnOutput: 'red-500',
	ciphertext: 'green-400',
	plaintext: 'blue-400'
};
