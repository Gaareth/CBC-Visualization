export function oneTimePad(plaintext: number[], key: number[]): number[] {
	return xorBlocks(plaintext, key);
}

export function xorBlocks(block1: number[], block2: number[]): number[] {
	return block1.map((byte, index) => byte ^ block2[index]);
}

export function stringToArray(str: string): number[] {
	const encoder = new TextEncoder();
	return Array.from(encoder.encode(str));
}
