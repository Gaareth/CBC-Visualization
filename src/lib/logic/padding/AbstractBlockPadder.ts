import { displayByte } from '$lib/utils/compute';
import { type Padder } from './padding';

export abstract class AbstractBlockPadder implements Padder {
	protected abstract constructPaddingBlock(paddingLength: number): Uint8Array;
	abstract validatePadding(input: Uint8Array): {
		valid: boolean;
		invalidIndices: number[];
		message: string;
	};

	pad(input: Uint8Array, blockSize: number): Uint8Array[] {
		if (input.length === 0) {
			return [this.constructPaddingBlock(blockSize)];
		}

		const chunks: Uint8Array[] = chunk(input, blockSize);

		const lastChunk = chunks.at(-1) ?? chunks[0];

		if (lastChunk.length === blockSize) {
			const fullPaddingBlock = this.constructPaddingBlock(blockSize);
			chunks.push(fullPaddingBlock);
			return chunks;
		}

		const paddingLength = blockSize - lastChunk.length;
		const remainingPadding = this.constructPaddingBlock(paddingLength);
		chunks[chunks.length - 1] = new Uint8Array([...lastChunk, ...remainingPadding]);

		return chunks;
	}

	validatePaddingLength(paddingLength: number, blockSize: number) {
		if (paddingLength > blockSize || paddingLength > 256 || paddingLength <= 0) {
			return {
				valid: false,
				invalidIndices: [blockSize - 1],
				message: `Expected 0 <= padding < ${Math.min(blockSize, 256)}. Got ${paddingLength}d (0x${displayByte(paddingLength, 'hex')})`
			};
		}

		return {
			valid: true
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
