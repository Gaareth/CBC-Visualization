import { xorBlocks } from './crypto-utils';
import { PKCS7Padder } from './padding/padder';
import type { Padder } from './padding/padding';

export function cbcEncryptBlocks(
	plaintextBlocks: Uint8Array[],
	key: Uint8Array,
	iv: Uint8Array,
	blockCipherFn: (plaintext: Uint8Array, key: Uint8Array) => Uint8Array
) {
	const ciphertextBlocks: Uint8Array[] = [iv];
	let previousBlock = iv;

	for (const plaintextBlock of plaintextBlocks) {
		const xored_block = xorBlocks(new Uint8Array(plaintextBlock), previousBlock);
		const encrypted_block = blockCipherFn(xored_block, key);
		ciphertextBlocks.push(encrypted_block);
		previousBlock = encrypted_block;
	}

	return ciphertextBlocks;
}

export function cbcEncrypt(
	plaintext: Uint8Array,
	key: Uint8Array,
	iv: Uint8Array,
	blockCipherFn: (plaintext: Uint8Array, key: Uint8Array) => Uint8Array,
	padder: Padder = new PKCS7Padder(),
	addIV: boolean | undefined = true
) {
	const plaintextBlocks: Uint8Array[] = padder.pad(plaintext, iv.length);
	const ciphertextBlocks = cbcEncryptBlocks(plaintextBlocks, key, iv, blockCipherFn);

	if (addIV) {
		plaintextBlocks.unshift(iv);
	}

	return {
		ciphertextBlocks,
		plaintextBlocks
	};
}

export function cbcDecrypt(
	ciphertextBlocks: Uint8Array[],
	key: Uint8Array,
	blockCipherFn: (plaintext: Uint8Array, key: Uint8Array) => Uint8Array
): Uint8Array[] {
	const ciphertextBlocksCopy: Uint8Array[] = ciphertextBlocks.map((block) => new Uint8Array(block));
	let previousCiphertext = ciphertextBlocksCopy[0];
	const plaintextBlocks: Uint8Array[] = [];

	// ignore iv
	for (const ciphertext_block of ciphertextBlocksCopy.slice(1)) {
		let decrypted_block = blockCipherFn(new Uint8Array(ciphertext_block), key);
		decrypted_block = xorBlocks(decrypted_block, previousCiphertext);
		plaintextBlocks.push(decrypted_block);
		previousCiphertext = ciphertext_block;
	}

	return plaintextBlocks;
}
