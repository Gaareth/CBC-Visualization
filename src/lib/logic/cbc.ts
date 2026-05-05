import { xorBlocks } from './crypto-utils';
import { PKCS7Padder, type Padder } from './padding';

export function cbcEncryptBlocks(
	plaintextBlocks: Uint8Array[],
	key: Uint8Array,
	iv: Uint8Array,
	blockCipherFn: (plaintext: Uint8Array, key: Uint8Array) => Uint8Array
) {
	const ciphertextBlocks: Uint8Array[] = [iv];
	let previousBlock = iv;

	for (const plaintextBlock of plaintextBlocks) {
		const xored_block = xorBlocks(plaintextBlock, previousBlock);
		const encrypted_block = blockCipherFn(xored_block, key);
		ciphertextBlocks.push(encrypted_block);
		previousBlock = encrypted_block;
	}

	return ciphertextBlocks;
}

export function cbcEncrypt(
	plaintext: number[],
	key: number[],
	iv: number[],
	blockCipherFn: (plaintext: number[], key: number[]) => number[],
	padder: Padder = new PKCS7Padder()
) {
	let plaintextBlocks: number[][] = padder.padd(plaintext, iv.length);
	let ciphertextBlocks = cbcEncryptBlocks(plaintextBlocks, key, iv, blockCipherFn);

	plaintextBlocks.unshift(iv);

	return {
		ciphertextBlocks,
		plaintextBlocks
	};
}

export function cbcDecrypt(
	ciphertextBlocks: number[][],
	key: number[],
	blockCipherFn: (plaintext: number[], key: number[]) => number[]
): number[][] {
	let previousCiphertext = ciphertextBlocks[0];
	const plaintextBlocks: number[][] = [];

	for (const ciphertext_block of ciphertextBlocks.slice(1)) {
		let decrypted_block = blockCipherFn(ciphertext_block, key);
		decrypted_block = xorBlocks(decrypted_block, previousCiphertext);
		plaintextBlocks.push(decrypted_block);
		previousCiphertext = ciphertext_block;
	}

	return plaintextBlocks;
}
