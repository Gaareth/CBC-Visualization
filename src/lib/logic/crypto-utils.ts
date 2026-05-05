export function oneTimePad(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
	return xorBlocks(plaintext, key);
}

export function xorBlocks(block1: Uint8Array, block2: Uint8Array): Uint8Array {
	return block1.map((byte, index) => byte ^ block2[index]);
}

export function stringToArray(str: string): Uint8Array {
	const encoder = new TextEncoder();
	return Uint8Array.from(encoder.encode(str));
}

export function toUint32(n: number): number {
	return n >>> 0; //unsigned right shift
}