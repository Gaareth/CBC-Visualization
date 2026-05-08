import { settingsState, type BlockCipher, type PaddingScheme } from '$lib/stores/settings.svelte';
import { cbcDecrypt, cbcEncrypt } from './cbc';
import { OTPCipher } from './ciphers/otp/cipherOTP';
import { TeaCipher } from './ciphers/tea/cipherTEA';
import { PKCS7Padder, type Padder } from './padding';

const cipherRegistry = {
	TEA: () => new TeaCipher(),
	OTP: () => new OTPCipher()
	// TwoFish: () => new TwoFishCipher(),
	// AES: () => new AESCipher(),
	// DES: () => new DESCipher(),
	// IDEA: () => new IDEACipher()
} satisfies Record<BlockCipher, () => Cipher>;

const padderRegistry = {
	PKCS7: () => new PKCS7Padder()
} satisfies Record<PaddingScheme, () => Padder>;

export function getBlockCipher(name: BlockCipher): Cipher {
	return cipherRegistry[name]();
}

export function getPadder(name: PaddingScheme): Padder {
	return padderRegistry[name]();
}

export function encryptCBCWithContext(
	plaintext: Uint8Array,
	iv: Uint8Array,
	settings: typeof settingsState
) {
	const cipher = getBlockCipher(settings.blockCipher);
	if (!cipher) {
		throw new Error(`Unsupported block cipher: ${settings.blockCipher}`);
	}

	const padder = getPadder(settings.paddingScheme);
	if (!padder) {
		throw new Error(`Unsupported padding scheme: ${settings.paddingScheme}`);
	}

	const key = getKey(cipher, plaintext, settings);

	return { ...cbcEncrypt(plaintext, key, iv, cipher.encrypt, padder), key };
}

export function getKey(cipher: Cipher, plaintext: Uint8Array, settings: typeof settingsState) {
	let key;
	if (cipher.getFixedKey) {
		key = cipher.getFixedKey();
	} else if (cipher.generateKey) {
		key = cipher.generateKey();
	} else if (cipher instanceof OTPCipher && cipher.generateKeyWithLength) {
		key = cipher.generateKeyWithLength(plaintext.length);
	} else {
		throw new Error(`Cipher ${settings.blockCipher} does not support key generation`);
	}


	return key;
}

export function decryptCBCWithContext(
	ciphertext: Uint8Array[],
	key: Uint8Array,
	settings: typeof settingsState
) {
	const cipher = getBlockCipher(settings.blockCipher);
	if (!cipher) {
		throw new Error(`Unsupported block cipher: ${settings.blockCipher}`);
	}

	const padder = getPadder(settings.paddingScheme);
	if (!padder) {
		throw new Error(`Unsupported padding scheme: ${settings.paddingScheme}`);
	}

	return cbcDecrypt(ciphertext, key, cipher.decrypt);
}
