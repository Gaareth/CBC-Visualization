export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

export function rotatedBoundingBox(width: number, height: number, rotationDeg: number) {
	const r = degToRad(rotationDeg);

	const rotatedWidth = Math.abs(height * Math.cos(r)) + Math.abs(width * Math.sin(r));

	const rotatedHeight = Math.abs(height * Math.sin(r)) + Math.abs(width * Math.cos(r));

	return {
		width: rotatedWidth,
		height: rotatedHeight
	};
}

export function getRandomInt(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomByteExcept(exceptions: number[] = []): number {
	const options = Array.from({ length: 256 }, (_, i) => i).filter((i) => !exceptions.includes(i));
	return options[Math.floor(Math.random() * options.length)];
}

export function displayByte(
	b: number | null | undefined,
	displayAs: 'hex' | 'ascii' | 'decimal',
	prependHexPrefix = false
): string {
	if (b == null) {
		return '?';
	}

	switch (displayAs) {
		case 'hex': {
			const hex = b.toString(16).toUpperCase().padStart(2, '0');
			return prependHexPrefix ? `0x${hex}` : hex;
		}
		case 'ascii':
			return String.fromCharCode(b);
		case 'decimal':
			return b.toString(10);
		default:
			return b.toString(16).toUpperCase().padStart(2, '0');
	}
}

/** FNV-1a 32-bit hash — small, fast, no crypto needed for a storage key */
export function fnv1a_hash(str: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
	}
	return h.toString(16).padStart(8, '0');
}
