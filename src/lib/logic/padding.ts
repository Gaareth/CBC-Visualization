export interface Padder {
	padd(input: number[], blockSize: number): number[][];
	validatePadding(input: number[]): { valid: boolean; invalidIndices?: number[]; message?: string };
	// unpad(input: number[], blockSize: number): number[];
}

export class PKCS7Padder implements Padder {
	padd(input: number[], blockSize: number): number[][] {
		const chunks = chunk(input, blockSize);
		const lastChunk = chunks[chunks.length - 1];

		if (lastChunk.length === blockSize) {
			const fullPaddingBlock = new Array(blockSize).fill(blockSize);
			return [...chunks, fullPaddingBlock];
		}

		const paddingLength = blockSize - (lastChunk.length % blockSize);
		chunks[chunks.length - 1] = [...lastChunk, ...new Array(paddingLength).fill(paddingLength)];

		return chunks;
	}

	validatePadding(input: number[]) {
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
			message: `Expected ${paddingLength}`
		};
	}
}

function chunk(array: number[], size: number): number[][] {
	const result: number[][] = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
}
