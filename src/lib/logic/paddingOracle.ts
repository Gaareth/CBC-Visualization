import { autoGate, delay } from '$lib/utils/generic';

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
		await blockGate.wait();
		progress?.onBlockStart?.(i);

		await recoverSingleBlock(
			ciphertextBlocks[i - 1],
			ciphertextBlocks[i],
			paddingOracle,
			outGuessedDecBlocks[i],
			outGuessedPlaintextBlocks[i],
			byteGate,
			guessGate,
			progress
		);
	}
}

export async function recoverSingleBlock(
	ivBlock: number[],
	ciphertextBlock: number[],
	paddingOracle: PaddingOracle,
	outGuessedDecBlock: number[],
	outGuessedPlaintextBlock: number[],
	byteGate: { wait: () => Promise<void> } = autoGate,
	guessGate: { wait: () => Promise<void> } = autoGate,
	progress?: AttackProgress
) {
	const blockSize = ivBlock.length;
	let originalIV = ivBlock.slice();

	// instead of replace, mutate due to reactivity
	fillArray(ivBlock, 0);

	for (let byte = 1; byte < blockSize + 1; byte++) {
		await byteGate.wait();
		progress?.onByteStart?.(byte);

		// want to set the resulting plaintext byte to 0x01, ..., 0x02, etc, so the padding matches
		// iv = byte xor dec
		for (let i = blockSize - 1; i >= blockSize - byte; i--) {
			ivBlock[i] = byte ^ outGuessedDecBlock[i];
		}

		for (let guess = 0; guess < 256; guess++) {
			await guessGate.wait();
			progress?.onGuess?.(guess);

			ivBlock[blockSize - byte] = guess;

			// await delay(15);
			let valid = paddingOracle([ivBlock, ciphertextBlock]);

			if (valid) {
				// e.g = 0x01 = tested iv byte xor unknown dec output byte
				// byte = iv xor dec
				const decByte = guess ^ byte;
				const guessedByte = originalIV[blockSize - byte] ^ decByte;

				outGuessedDecBlock[blockSize - byte] = decByte;
				outGuessedPlaintextBlock[blockSize - byte] = guessedByte;
				break;
			}
		}
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
	delayMs: number = 100
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

		await delay(delayMs);
		let valid = paddingOracle(ciphertextBlocks);

		if (!valid) {
			// i is the index of the first byte that results in invalid padding,
			// so the padding length is this byte plus the number of bytes after it, which is blockSize - i
			return blockSize - i;
		}
	}

	return null;
}
