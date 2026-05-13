import { autoGate } from '$lib/utils/generic';
import type { PaddingOracle } from '.';

export async function findPaddingLengthWithOracle(
	ciphertextBlocks: Uint8Array[],
	paddingOracle: PaddingOracle,
	byteGate: { wait: () => Promise<void> } = autoGate,
	onCiphertextChange?: () => void
): Promise<number | null> {
	// Find the first byte that results in invalid padding
	// Go from left to right. If padding is valid only a data byte has been changed
	// If invalid, a padding byte has been changed. We know where the padding starts.
	if (ciphertextBlocks.length < 2) {
		throw new Error('Need at least 2 blocks to find padding length');
	}

	const blockSize = ciphertextBlocks[0].length;
	let secondLastCipherBlock = ciphertextBlocks[ciphertextBlocks.length - 2];

	for (let i = 0; i < blockSize; i++) {
		let originalByte = secondLastCipherBlock[i];
		secondLastCipherBlock[i] = (originalByte + 1) % 256;
		onCiphertextChange?.();

		await byteGate.wait();
		let valid = paddingOracle(ciphertextBlocks);

		if (!valid) {
			// i is the index of the first byte that results in invalid padding,
			// so the padding length is this byte plus the number of bytes after it, which is blockSize - i
			return blockSize - i;
		}
	}

	return null;
}
