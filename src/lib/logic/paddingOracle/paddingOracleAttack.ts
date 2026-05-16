import type { PaddingScheme } from '$lib/stores/settings.svelte';
import { autoGate } from '$lib/utils/generic';
import type { PaddingOracle } from '.';
import {
	normalizeShared,
	type AttackBlockOptions,
	type AttackByteOptions,
	type AttackOptions
} from './attackOptions';

export const ATTACKABLE_PADDING_SCHEMES = [
	'PKCS#5/7',
	'ANSI X9.23 (zeros)'
] as const satisfies readonly PaddingScheme[];
export type SupportedAttackablePaddingSchemes = (typeof ATTACKABLE_PADDING_SCHEMES)[number];

export function isAttackablePaddingScheme(
	paddingScheme: PaddingScheme
): paddingScheme is SupportedAttackablePaddingSchemes {
	return ATTACKABLE_PADDING_SCHEMES.includes(paddingScheme as SupportedAttackablePaddingSchemes);
}

/**
 * Recovers plaintext blocks from ciphertext blocks using a padding oracle.
 * @param ciphertextBlocks the array of ciphertext blocks, including the IV as the first block (i.e. [IV, C1, C2, ...])
 * @param paddingOracle the padding oracle function that takes an array of blocks (e.g. [IV, C1]) and returns whether the padding is valid
 * @param paddingScheme the padding scheme, which the oracle is based on (e.g. PKCS#7, ANSI X9.23, etc.)
 * @param opts options for the attack, such as gates for synchronization, callbacks for progress updates, and output arrays for the guessed intermediate decrypted blocks and plaintext blocks
 */
export async function recoverPlaintextWithOracle(
	ciphertextBlocks: Uint8Array[],
	paddingOracle: PaddingOracle,
	paddingScheme: SupportedAttackablePaddingSchemes,
	opts: AttackOptions = {}
) {
	const { progress } = normalizeShared(opts);
	const outGuessedDecBlocks = opts.outGuessedDecBlocks ?? [];
	const outGuessedPlaintextBlocks = opts.outGuessedPlaintextBlocks ?? [];

	const blockGate = opts.blockGate ?? autoGate;

	for (let i = ciphertextBlocks.length - 1; i > 0; i--) {
		progress?.onBlockStart?.(i);

		await recoverSingleBlock(
			ciphertextBlocks[i - 1],
			ciphertextBlocks[i],
			paddingOracle,
			paddingScheme,
			{
				...opts,
				outGuessedDecBlock: (outGuessedDecBlocks[i] ??= []),
				outGuessedPlaintextBlock: (outGuessedPlaintextBlocks[i] ??= [])
			}
		);

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
	paddingScheme: SupportedAttackablePaddingSchemes,
	opts: AttackBlockOptions = {}
) {
	const { interactionGate, progress } = normalizeShared(opts);
	const outGuessedDecBlock = opts.outGuessedDecBlock ?? [];
	const byteGate = opts.byteGate ?? autoGate;

	const blockSize = ivBlock.length;
	const originalIV = ivBlock.slice();

	// instead of replace, mutate due to reactivity
	// fillArray(ivBlock, 0);

	for (let byte = 1; byte <= blockSize; byte++) {
		progress?.onByteStart?.(byte);

		if (byte > 1) {
			await interactionGate.wait();

			prepareIV(blockSize, byte, ivBlock, outGuessedDecBlock, paddingScheme);
			progress?.onCiphertextChange?.();
			progress?.onProgressUpdate?.({ event: 'after-set-padding-bytes', data: { byte } });
			await interactionGate.wait();
		}

		await recoverSingleByte(byte, ivBlock, ciphertextBlock, paddingOracle, paddingScheme, opts);
		progress?.onByteEnd?.(byte);
		if (byte != blockSize) {
			await byteGate.wait();
		}
	}

	setArray(ivBlock, originalIV); // restore IV for next round with reactivity
	progress?.onCiphertextChange?.();
}

function prepareIV(
	blockSize: number,
	byte: number,
	ivBlock: Uint8Array<ArrayBufferLike>,
	outGuessedDecBlock: (number | undefined)[],
	paddingScheme: SupportedAttackablePaddingSchemes
) {
	const getDecByte = (index: number): number => {
		const decByte = outGuessedDecBlock[index];
		if (decByte === undefined) {
			throw new Error(`Missing guessed dec byte for padding at index ${index}`);
		}
		return decByte;
	};

	// prepare the rest of the padding so modifying the current IV at byte index will result in valid padding only if its $byte
	if (paddingScheme === 'PKCS#5/7') {
		// E.g. For testing 0x03, all bytes after it should be set to 0x03

		// byteGuess (e.g. 0x03) = IV xor DEC
		// iv = byte xor dec
		for (let i = blockSize - 1; i > blockSize - byte; i--) {
			const decByte = getDecByte(i);
			ivBlock[i] = byte ^ decByte;
		}
	} else if (paddingScheme === 'ANSI X9.23 (zeros)') {
		// To recover P[-2]: P[-1] must be >= 0x02.
		// To recover P[-3]: P[-2] must be zero, and P[-1] must be >= 0x03
		ivBlock[blockSize - 1] = byte ^ getDecByte(blockSize - 1);
		for (let i = blockSize - 1 - 1; i > blockSize - byte; i--) {
			const decByte = getDecByte(i);
			ivBlock[i] = 0x00 ^ decByte;
		}
	}
}

export async function recoverSingleByte(
	byte: number, // between 1 and blockSize
	ivBlock: Uint8Array,
	ciphertextBlock: Uint8Array,
	paddingOracle: PaddingOracle,
	paddingScheme: SupportedAttackablePaddingSchemes,
	opts: AttackByteOptions = {}
) {
	const { interactionGate, progress, skipEdgeCaseCheck } = normalizeShared(opts);
	const outGuessedDecBlock = opts.outGuessedDecBlock ?? [];
	const outGuessedPlaintextBlock = opts.outGuessedPlaintextBlock ?? [];

	const guessGate = opts.guessGate ?? autoGate;

	const blockSize = ivBlock.length;
	const originalIV = ivBlock.slice();

	for (let guess = 0; guess < 256; guess++) {
		// console.log(`guessing byte ${byte}: ${guess}`);
		progress?.onGuess?.(guess);

		ivBlock[blockSize - byte] = guess;
		progress?.onCiphertextChange?.();

		const valid = paddingOracle([ivBlock, ciphertextBlock]);

		if (valid) {
			// check edge case that byte is actually X .. X 0x01, and not X .. 0x2 0x02, which would also be valid padding
			if (byte === 1 && !skipEdgeCaseCheck) {
				progress?.onProgressUpdate?.({ event: 'edge-case-check' });
				await interactionGate.wait();

				// check if next byte is also padding.
				// if it is not padding, then we know the padding is 0x01 and not 0x02 or more
				ivBlock[blockSize - byte - 1] ^= 1;
				const valid2 = paddingOracle([ivBlock, ciphertextBlock]);
				progress?.onCiphertextChange?.();

				progress?.onProgressUpdate?.({
					event: 'edge-case-check-result',
					data: { paddingValid: valid2 }
				});
				await interactionGate.wait();

				ivBlock[blockSize - byte - 1] ^= 1; // restore
				progress?.onCiphertextChange?.();

				// if we found 0x01, then changing the previous byte should not make it invalid
				// invalid means we found 0x02, or 0x03, etc.
				if (!valid2) {
					continue;
				}
			}

			const expectedPlaintextByte = getExpectedPlaintextByte(paddingScheme, byte);

			progress?.onProgressUpdate?.({ event: 'on-byte-recovered', data: { expectedPlaintextByte } });
			await interactionGate.wait();

			// e.g = 0x01 = tested iv byte xor unknown dec output byte
			// byte = iv xor dec
			const { decByte, guessedByte, originalIVByte, decByteXoredWith } = recoverByte(
				guess,
				byte,
				originalIV,
				blockSize,
				paddingScheme
			);

			outGuessedDecBlock[blockSize - byte] = decByte;
			outGuessedPlaintextBlock[blockSize - byte] = guessedByte;
			progress?.onOutputChange?.();

			progress?.onProgressUpdate?.({
				event: 'byte-recovered-result',
				data: {
					guessedByte,
					decByte,
					guess,
					originalIVByte,
					decByteXoredWith
				}
			});
			// outGuessedDecBlock[0]

			break;
		}

		await guessGate.wait();
	}
}

/// Returns the expected plaintext byte, when the padding oracle returns valid for a given guess
function getExpectedPlaintextByte(paddingScheme: SupportedAttackablePaddingSchemes, byte: number) {
	switch (paddingScheme) {
		case 'PKCS#5/7': {
			// PKCS#5/7: all padding bytes have the same value as the number of padding bytes (e.g. 0x03 0x03 0x03)
			return byte;
		}

		case 'ANSI X9.23 (zeros)': {
			// ANSI X9.23: only the last byte encodes padding length (0x01), so for byte == we expect 0x01
			// and for all other padding bytes we expect 0x00
			return byte === 1 ? 0x01 : 0x00;
		}

		default: {
			const _exhaustive: never = paddingScheme;
			throw new Error(`Unsupported padding scheme: ${_exhaustive}`);
		}
	}
}

/// Recovers the original  plaintext byte value
function recoverByte(
	guess: number,
	byte: number,
	originalIV: Uint8Array<ArrayBuffer>,
	blockSize: number,
	paddingScheme: SupportedAttackablePaddingSchemes
) {
	const originalIVByte = originalIV[blockSize - byte];
	// P = IV xor DEC

	// get P (through the info leak using the padding oracle)
	const expectedPlaintextByte = getExpectedPlaintextByte(paddingScheme, byte);
	// For P holds: expectedPlaintextByte = IVguess xor DEC

	// Rearrange: DEC = IVguess xor expectedPlaintextByte
	const decByte = guess ^ expectedPlaintextByte;

	// Now get the *original* plaintext byte using the *original* IV: P = IVoriginal xor DEC
	const guessedByte = originalIVByte ^ decByte;

	return { decByte, guessedByte, originalIVByte, decByteXoredWith: expectedPlaintextByte };
}

// function fillArray(arr: Uint8Array, newValue: number) {
// 	for (let i = 0; i < arr.length; i++) {
// 		arr[i] = newValue;
// 	}
// }

function setArray(arr: Uint8Array, newValues: Uint8Array) {
	for (let i = 0; i < arr.length; i++) {
		arr[i] = newValues[i];
	}
}
