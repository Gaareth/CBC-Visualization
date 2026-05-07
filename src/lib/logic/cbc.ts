import { xorBlocks } from './crypto-utils';
import { PKCS7Padder, type Padder } from './padding';

export function cbcEncryptBlocks(
	plaintextBlocks: number[][],
	key: number[],
	iv: number[],
	blockCipherFn: (plaintext: number[], key: number[]) => number[]
) {
<<<<<<< Updated upstream
	const ciphertextBlocks: number[][] = [iv];
	let previousBlock = iv;
=======
	const ciphertextBlocks: Uint8Array[] = [iv];
	let previousBlock: Uint8Array = iv.slice();
>>>>>>> Stashed changes

	for (const plaintextBlock of plaintextBlocks) {
		const xored_block = xorBlocks(plaintextBlock, previousBlock);
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
	padder: Padder = new PKCS7Padder()
) {
	let plaintextBlocks: Uint8Array[] = padder.padd(plaintext, iv.length);
	let ciphertextBlocks = cbcEncryptBlocks(plaintextBlocks, key, iv, blockCipherFn);

	plaintextBlocks.unshift(iv);

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
	let ciphertextCopy = ciphertextBlocks.map(block => new Uint8Array(block));

	let previousCiphertext = ciphertextCopy[0];
	const plaintextBlocks: Uint8Array[] = [];

	for (const ciphertext_block of ciphertextCopy.slice(1)) {
		let decrypted_block = blockCipherFn(new Uint8Array(ciphertext_block), key); // Make a copy to avoid mutating the original
		decrypted_block = xorBlocks(decrypted_block, previousCiphertext);
		plaintextBlocks.push(decrypted_block);
		previousCiphertext = ciphertext_block;
	}

	return plaintextBlocks;
}
