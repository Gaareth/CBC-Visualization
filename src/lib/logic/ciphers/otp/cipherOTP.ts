import { generateKeyFromString, oneTimePad } from '$lib/logic/crypto-utils';
import type { Cipher } from '../ciphers';

export class OTPCipher implements Cipher {
	public keySizeBytes = undefined; // OTP can use any key size, but we'll set this to undefined to indicate that
	public blockSizeBytes = undefined; // OTP operates on the entire plaintext, so block size is not applicable

	public encrypt = (plaintext: Uint8Array, key: Uint8Array): Uint8Array => {
		return oneTimePad(plaintext, key);
	};
	public decrypt = (ciphertext: Uint8Array, key: Uint8Array): Uint8Array => {
		return this.encrypt(ciphertext, key); // OTP decryption is the same as encryption
	};

	public getFixedKey(): Uint8Array {
		const codebook =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
		return generateKeyFromString(codebook);
	}

	public generateKeyWithLength = (length: number): Uint8Array => {
		const key = new Uint8Array(length);
		crypto.getRandomValues(key);
		return key;
	};
}
