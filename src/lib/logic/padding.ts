import { displayByte } from "$lib/utils/compute";

export interface Padder {
	padd(input: Uint8Array, blockSize: number): Uint8Array[];
	validatePadding(input: Uint8Array): { valid: boolean; invalidIndices?: number[]; message?: string };
	// unpad(input: number[], blockSize: number): number[];
}

export class PKCS7Padder implements Padder {
	padd(input: Uint8Array, blockSize: number): Uint8Array[] {
		const chunks: Uint8Array[] = chunk(input, blockSize);
		const lastChunk = chunks[chunks.length - 1];

		if (lastChunk.length === blockSize) {
			const fullPaddingBlock = new Uint8Array(blockSize).fill(blockSize);
			return [...chunks, fullPaddingBlock];
		}

		const paddingLength = blockSize - (lastChunk.length % blockSize);
		chunks[chunks.length - 1] = new Uint8Array([
			...lastChunk,
			...new Uint8Array(paddingLength).fill(paddingLength)
		]);

		return chunks;
	}

	validatePadding(input: Uint8Array) {
		const blockSize = input.length;
		const paddingLength = input[input.length - 1];

		if (paddingLength > blockSize || paddingLength > 256 || paddingLength <= 0) {
			return {
				valid: false,
				invalidIndices: [input.length - 1],
				message: `Expected 0 <= padding < ${Math.min(blockSize, 256)}. Got ${paddingLength}`
			};
		}

		const invalidPaddingIndices = [];
		for (let i = input.length - paddingLength; i < input.length; i++) {
			if (input[i] !== paddingLength) {
				invalidPaddingIndices.push(i);
			}
		}

		return {
			valid: invalidPaddingIndices.length === 0,
			invalidIndices: invalidPaddingIndices,
			message: `Expected ${paddingLength} bytes of value 0x${displayByte(paddingLength, "hex")}.`
		};
	}
}

export function chunk<T extends { slice(start: number, end: number): T; length: number }>(
	array: T,
	size: number
): T[] {
	const result: T[] = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
}
