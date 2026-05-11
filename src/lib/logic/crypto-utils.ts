import { PKCS7Padder } from './padding/padder';

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

export function generateKeyFromString(s: string, keySizeBytes?: number): Uint8Array {
	const arr = [];
	for (let char of s) {
		arr.push(char.charCodeAt(0));
	}
	const arrTyped = new Uint8Array(arr);
	if (!keySizeBytes) {
		return arrTyped;
	}

	const padder = new PKCS7Padder();
	return padder.pad(arrTyped, keySizeBytes)[0];
}
