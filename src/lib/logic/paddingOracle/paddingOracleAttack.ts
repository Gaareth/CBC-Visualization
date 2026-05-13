import type { PaddingScheme } from '$lib/stores/settings.svelte';
import { autoGate } from '$lib/utils/generic';
import type { PaddingOracle } from '.';
import { normalizeShared, normalizeSharedBlock, type AttackBlockOptions, type AttackByteOptions, type AttackOptions } from './attackOptions';

export const ATTACKABLE_PADDING_SCHEMES = [
	'PKCS#5/7',
	'ANSI X9.23 (zeros)'
] as const satisfies readonly PaddingScheme[];
export type SupportedAttackablePaddingSchemes = (typeof ATTACKABLE_PADDING_SCHEMES)[number];

export async function recoverPlaintextWithOracle(
	ciphertextBlocks: Uint8Array[],
	paddingOracle: PaddingOracle,
	paddingScheme: SupportedAttackablePaddingSchemes,
	opts: AttackOptions = {}
) {
	const { progress } = normalizeShared(opts);
	const blockGate = opts.blockGate ?? autoGate;

	for (let i = ciphertextBlocks.length - 1; i > 0; i--) {
		progress?.onBlockStart?.(i);

		await recoverSingleBlock(
			ciphertextBlocks[i - 1],
			ciphertextBlocks[i],
			paddingOracle,
			paddingScheme,
			opts
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
	const { outGuessedDecBlock } = normalizeSharedBlock(opts);
	const byteGate = opts.byteGate ?? autoGate;

	const blockSize = ivBlock.length;
	let originalIV = ivBlock.slice();

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
	const { outGuessedDecBlock, outGuessedPlaintextBlock } = normalizeSharedBlock(opts);
	const guessGate = opts.guessGate ?? autoGate;

	const blockSize = ivBlock.length;
	let originalIV = ivBlock.slice();

	for (let guess = 0; guess < 256; guess++) {
		// console.log(`guessing byte ${byte}: ${guess}`);
		progress?.onGuess?.(guess);

		ivBlock[blockSize - byte] = guess;
		progress?.onCiphertextChange?.();

		let valid = paddingOracle([ivBlock, ciphertextBlock]);

		if (valid) {
			// check edge case that byte is actually X .. X 0x01, and not X .. 0x2 0x02, which would also be valid padding
			if (byte === 1 && !skipEdgeCaseCheck) {
				progress?.onProgressUpdate?.({ event: 'edge-case-check' });
				await interactionGate.wait();

				// check if next byte is also padding.
				// if it is not padding, then we know the padding is 0x01 and not 0x02 or more
				ivBlock[blockSize - byte - 1] ^= 1;
				let valid2 = paddingOracle([ivBlock, ciphertextBlock]);
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

			progress?.onProgressUpdate?.({ event: 'on-byte-recovered' });
			await interactionGate.wait();

			// e.g = 0x01 = tested iv byte xor unknown dec output byte
			// byte = iv xor dec
			const decByte = guess ^ byte;
			const originalIVByte = originalIV[blockSize - byte];
			const guessedByte = originalIVByte ^ decByte;

			outGuessedDecBlock[blockSize - byte] = decByte;
			outGuessedPlaintextBlock[blockSize - byte] = guessedByte;
			progress?.onOutputChange?.();

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
