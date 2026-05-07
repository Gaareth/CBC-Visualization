import { autoGate } from '$lib/utils/generic';

type BeforeEdgeCaseCheck = {
	event: 'edge-case-check';
};
type EdgeCaseCheckResult = {
	event: 'edge-case-check-result';
	data: {
		paddingValid: boolean;
	};
};

type OnByteRecovered = {
	event: 'on-byte-recovered';
};

export type ByteRecoveredResult = {
	event: 'byte-recovered-result';
	data: {
		guessedByte: number;
		decByte: number;
		guess: number;
		originalIVByte: number;
	};
};

type OnByteStart = {
	event: 'on-byte-start';
};

type OnBlockStart = {
	event: 'on-block-start';
};

type OnByteEnd = {
	event: 'on-byte-end';
};

type OnBlockEnd = {
	event: 'on-block-end';
	data: {
		blockIndex: number;
	};
};

type AfterSetPaddingBytes = {
	event: 'after-set-padding-bytes';
	data: {
		byte: number;
	};
};

export type AttackEvent =
	| BeforeEdgeCaseCheck
	| EdgeCaseCheckResult
	| ByteRecoveredResult
	| OnByteRecovered
	| OnByteStart
	| AfterSetPaddingBytes
	| OnBlockStart
	| OnByteEnd
	| OnBlockEnd;

type AttackProgress = {
	onBlockStart?: (blockIndex: number) => void;
	onBlockEnd?: (blockIndex: number) => void;
	onByteStart?: (byteIndex: number) => void;
	onByteEnd?: (byteIndex: number) => void;
	onGuess?: (guess: number) => void;
	onProgressUpdate?: (event: AttackEvent) => void;
};

export type PaddingOracle = (ciphertextBlocks: Uint8Array[]) => boolean;

export async function recoverPlaintextWithOracle(
	ciphertextBlocks: Uint8Array[],
	paddingOracle: PaddingOracle,
	{
		skipEdgeCaseCheck = false,
		outGuessedDecBlocks = [],
		outGuessedPlaintextBlocks = [],
		blockGate = autoGate,
		byteGate = autoGate,
		guessGate = autoGate,
		interactionGate = autoGate,
		progress
	}: {
		skipEdgeCaseCheck?: boolean;
		outGuessedDecBlocks?: (number | undefined)[][];
		outGuessedPlaintextBlocks?: (number | undefined)[][];
		blockGate?: { wait: () => Promise<void> };
		byteGate?: { wait: () => Promise<void> };
		guessGate?: { wait: () => Promise<void> };
		interactionGate?: { wait: () => Promise<void> };
		progress?: AttackProgress;
	}
) {
	for (let i = ciphertextBlocks.length - 1; i > 0; i--) {
		progress?.onBlockStart?.(i);

		await recoverSingleBlock(ciphertextBlocks[i - 1], ciphertextBlocks[i], paddingOracle, {
			outGuessedDecBlock: outGuessedDecBlocks[i],
			outGuessedPlaintextBlock: outGuessedPlaintextBlocks[i],
			byteGate,
			guessGate,
			interactionGate,
			progress,
			skipEdgeCaseCheck
		});

		progress?.onBlockEnd?.(i);
		if (i != 1) {
			await blockGate.wait();
		}
	}
}

export async function recoverSingleBlock(
	ivBlock: Uint8Array,
	ciphertextBlock: Uint8Array,
	paddingOracle: PaddingOracle,
	{
		skipEdgeCaseCheck = false,
		outGuessedDecBlock = [],
		outGuessedPlaintextBlock = [],
		byteGate = autoGate,
		guessGate = autoGate,
		interactionGate = autoGate,
		progress
	}: {
		skipEdgeCaseCheck?: boolean;
		outGuessedDecBlock?: (number | undefined)[];
		outGuessedPlaintextBlock?: (number | undefined)[];
		byteGate?: { wait: () => Promise<void> };
		guessGate?: { wait: () => Promise<void> };
		interactionGate?: { wait: () => Promise<void> };
		progress?: AttackProgress;
	}
) {
	const blockSize = ivBlock.length;
	let originalIV = ivBlock.slice();

	// instead of replace, mutate due to reactivity
	// fillArray(ivBlock, 0);

	for (let byte = 1; byte < blockSize + 1; byte++) {
		progress?.onByteStart?.(byte);

		if (byte > 1) {
			await interactionGate.wait();
			// want to set the resulting plaintext byte to 0x01, ..., 0x02, etc, so the padding matches
			// iv = byte xor dec
			for (let i = blockSize - 1; i > blockSize - byte; i--) {
				ivBlock[i] = byte ^ outGuessedDecBlock[i]!;
			}
			progress?.onProgressUpdate?.({ event: 'after-set-padding-bytes', data: { byte } });
			await interactionGate.wait();
		}

		await recoverSingleByte(byte, ivBlock, ciphertextBlock, paddingOracle, {
			outGuessedDecBlock,
			outGuessedPlaintextBlock,
			guessGate,
			interactionGate,
			progress,
			skipEdgeCaseCheck
		});
		progress?.onByteEnd?.(byte);
		if (byte != blockSize) {
			await byteGate.wait();
		}
	}

	setArray(ivBlock, originalIV); // restore IV for next round with reactivity
}

export async function recoverSingleByte(
	byte: number,
	ivBlock: Uint8Array,
	ciphertextBlock: Uint8Array,
	paddingOracle: PaddingOracle,
	{
		skipEdgeCaseCheck = false,
		outGuessedDecBlock = [],
		outGuessedPlaintextBlock = [],
		guessGate = autoGate,
		interactionGate = autoGate,
		progress
	}: {
		skipEdgeCaseCheck?: boolean;
		outGuessedDecBlock?: (number | undefined)[];
		outGuessedPlaintextBlock?: (number | undefined)[];
		guessGate?: { wait: () => Promise<void> };
		interactionGate?: { wait: () => Promise<void> };

		progress?: AttackProgress;
	} = {}
) {
	const blockSize = ivBlock.length;
	let originalIV = ivBlock.slice();

	for (let guess = 0; guess < 256; guess++) {
		console.log(`guessing byte ${byte}: ${guess}`);
		progress?.onGuess?.(guess);

		ivBlock[blockSize - byte] = guess;

		let valid = paddingOracle([ivBlock, ciphertextBlock]);

		if (valid) {
			// check edge case that byte is actually X .. X 0x01, and not X .. 0x2 0x02, which would also be valid padding
			if (byte === 1 && !skipEdgeCaseCheck) {
				progress?.onProgressUpdate?.({ event: 'edge-case-check' });
				await interactionGate.wait();

				ivBlock[blockSize - byte - 1] ^= 1;
				let valid2 = paddingOracle([ivBlock, ciphertextBlock]);

				progress?.onProgressUpdate?.({
					event: 'edge-case-check-result',
					data: { paddingValid: valid2 }
				});
				await interactionGate.wait();

				// if we found 0x01, then changing the previous byte should not make it invalid
				// invalid means we found 0x02, or 0x03, etc.
				if (!valid2) {
					continue;
				}
			}

			progress?.onProgressUpdate?.({ event: 'on-byte-recovered' });
			await interactionGate.wait();

			// e.g = 0x01 = tested iv byte xor unknown dec output byte
			// byte = iv xor dec
			const decByte = guess ^ byte;
			const originalIVByte = originalIV[blockSize - byte];
			const guessedByte = originalIVByte ^ decByte;

			outGuessedDecBlock[blockSize - byte] = decByte;
			outGuessedPlaintextBlock[blockSize - byte] = guessedByte;

			progress?.onProgressUpdate?.({
				event: 'byte-recovered-result',
				data: {
					guessedByte,
					decByte,
					guess,
					originalIVByte
				}
			});
			// outGuessedDecBlock[0]

			break;
		}

		await guessGate.wait();
	}
}

function fillArray(arr: Uint8Array, newValue: number) {
	for (let i = 0; i < arr.length; i++) {
		arr[i] = newValue;
	}
}

function setArray(arr: Uint8Array, newValues: Uint8Array) {
	for (let i = 0; i < arr.length; i++) {
		arr[i] = newValues[i];
	}
}

export async function findPaddingLengthWithOracle(
	ciphertextBlocks: Uint8Array[],
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
