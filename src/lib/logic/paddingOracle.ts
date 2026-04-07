import { autoGate } from '$lib/utils/generic';

type AttackProgress = {
	onBlockStart?: (blockIndex: number) => void;
	onByteStart?: (byteIndex: number) => void;
	onGuess?: (guess: number) => void;
};

export type PaddingOracle = (ciphertextBlocks: number[][]) => boolean;

export async function recoverPlaintextWithOracle(
	ciphertextBlocks: number[][],
	paddingOracle: PaddingOracle,
	{
		outGuessedDecBlocks = [],
		outGuessedPlaintextBlocks = [],
		blockGate = autoGate,
		byteGate = autoGate,
		guessGate = autoGate,
		progress
	}: {
		outGuessedDecBlocks?: number[][];
		outGuessedPlaintextBlocks?: number[][];
		blockGate?: { wait: () => Promise<void> };
		byteGate?: { wait: () => Promise<void> };
		guessGate?: { wait: () => Promise<void> };
		progress?: AttackProgress;
	}
) {
	for (let i = ciphertextBlocks.length - 1; i > 0; i--) {
		progress?.onBlockStart?.(i);
		await blockGate.wait();

		await recoverSingleBlock(ciphertextBlocks[i - 1], ciphertextBlocks[i], paddingOracle, {
			outGuessedDecBlock: outGuessedDecBlocks[i],
			outGuessedPlaintextBlock: outGuessedPlaintextBlocks[i],
			byteGate,
			guessGate,
			progress
		});
	}
}

export async function recoverSingleByte(
	byte: number,
	ivBlock: number[],
	ciphertextBlock: number[],
	paddingOracle: PaddingOracle,
	{
		skipEdgeCaseCheck = false,
		outGuessedDecBlock = [],
		outGuessedPlaintextBlock = [],
		guessGate = autoGate,
		progress
	}: {
		skipEdgeCaseCheck?: boolean;
		outGuessedDecBlock?: number[];
		outGuessedPlaintextBlock?: number[];
		guessGate?: { wait: () => Promise<void> };
		progress?: AttackProgress;
	} = {}
) {
	const blockSize = ivBlock.length;
	let originalIV = ivBlock.slice();

	for (let guess = 0; guess < 256; guess++) {
		console.log(`guessing byte ${byte}: ${guess}`);
		progress?.onGuess?.(guess);

		ivBlock[blockSize - byte] = guess;

		// await delay(15);
		let valid = paddingOracle([ivBlock, ciphertextBlock]);

		if (valid) {
			// check edge case that byte is actually X .. X 0x01, and not X .. 0x2 0x02, which would also be valid padding
			if (byte === 1 && !skipEdgeCaseCheck) {
				ivBlock[blockSize - byte - 1] ^= 1;
				let valid2 = paddingOracle([ivBlock, ciphertextBlock]);

				// if we found 0x01, then changing the previous byte should not make it invalid
				// invalid means we found 0x02, or 0x03, etc.
				if (!valid2) {
					continue;
				}
			}

			// e.g = 0x01 = tested iv byte xor unknown dec output byte
			// byte = iv xor dec
			const decByte = guess ^ byte;
			const guessedByte = originalIV[blockSize - byte] ^ decByte;

			outGuessedDecBlock[blockSize - byte] = decByte;
			outGuessedPlaintextBlock[blockSize - byte] = guessedByte;
			break;
		}

		await guessGate.wait();
	}
}

export async function recoverSingleBlock(
	ivBlock: number[],
	ciphertextBlock: number[],
	paddingOracle: PaddingOracle,
	{
		outGuessedDecBlock = [],
		outGuessedPlaintextBlock = [],
		byteGate = autoGate,
		guessGate = autoGate,
		progress
	}: {
		outGuessedDecBlock?: number[];
		outGuessedPlaintextBlock?: number[];
		byteGate?: { wait: () => Promise<void> };
		guessGate?: { wait: () => Promise<void> };
		progress?: AttackProgress;
	}
) {
	const blockSize = ivBlock.length;
	let originalIV = ivBlock.slice();

	// instead of replace, mutate due to reactivity
	fillArray(ivBlock, 0);

	for (let byte = 1; byte < blockSize + 1; byte++) {
		progress?.onByteStart?.(byte);
		await byteGate.wait();

		// want to set the resulting plaintext byte to 0x01, ..., 0x02, etc, so the padding matches
		// iv = byte xor dec
		for (let i = blockSize - 1; i >= blockSize - byte; i--) {
			ivBlock[i] = byte ^ outGuessedDecBlock[i];
		}

		await recoverSingleByte(byte, ivBlock, ciphertextBlock, paddingOracle, {
			outGuessedDecBlock,
			outGuessedPlaintextBlock,
			guessGate,
			progress
		});
	}

	setArray(ivBlock, originalIV); // restore IV for next round with reactivity
}

function fillArray(arr: number[], newValue: number) {
	for (let i = 0; i < arr.length; i++) {
		arr[i] = newValue;
	}
}

function setArray(arr: number[], newValues: number[]) {
	for (let i = 0; i < arr.length; i++) {
		arr[i] = newValues[i];
	}
}

export async function findPaddingLengthWithOracle(
	ciphertextBlocks: number[][],
	paddingOracle: PaddingOracle,
	byteGate: { wait: () => Promise<void> } = autoGate
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
