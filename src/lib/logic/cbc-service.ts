import { settingsState, type BlockCipher, type PaddingScheme } from '$lib/stores/settings.svelte';
import { cbcDecrypt, cbcEncrypt } from './cbc';
import { OTPCipher } from './ciphers/otp/cipherOTP';
import { TeaCipher } from './ciphers/tea/cipherTEA';
import { PKCS7Padder, type Padder } from './padding';
import type { PaddingOracle } from './paddingOracle';

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

export function getCBCSettings(plaintext: Uint8Array, settings: typeof settingsState) {
	const cipher = getBlockCipher(settings.blockCipher);
	if (!cipher) {
		throw new Error(`Unsupported block cipher: ${settings.blockCipher}`);
	}

	const padder = getPadder(settings.paddingScheme);
	if (!padder) {
		throw new Error(`Unsupported padding scheme: ${settings.paddingScheme}`);
	}

	const key = getKey(cipher, plaintext);

	return { cipher, padder, key };
}

export function encryptCBCWithContext(
	plaintext: Uint8Array,
	iv: Uint8Array,
	settings: typeof settingsState,
	addIV: boolean | undefined = true
) {
	const cipher = getBlockCipher(settings.blockCipher);
	if (!cipher) {
		throw new Error(`Unsupported block cipher: ${settings.blockCipher}`);
	}

	const padder = getPadder(settings.paddingScheme);
	if (!padder) {
		throw new Error(`Unsupported padding scheme: ${settings.paddingScheme}`);
	}

	const key = getKey(cipher, plaintext);

	return {
		...cbcEncrypt(plaintext, key, new Uint8Array(iv), cipher.encrypt, padder, addIV),
		key,
		padder
	};
}

export function getKey(cipher: Cipher, plaintext: Uint8Array) {
	let key;
	if (cipher.getFixedKey) {
		key = cipher.getFixedKey();
	} else if (cipher.generateKey) {
		key = cipher.generateKey();
	} else if (cipher instanceof OTPCipher && cipher.generateKeyWithLength) {
		key = cipher.generateKeyWithLength(plaintext.length);
	} else {
		throw new Error(`Cipher ${cipher} does not support key generation`);
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

// const paddingOracle: PaddingOracle = (cBlocks) => {
// 	const decrypted = cbcDecrypt(cBlocks, key, oneTimePad);
// 	const lastBlock = decrypted[decrypted.length - 1];

// 	const result = padder.validatePadding(lastBlock);
// 	paddingValidation = result;

// 	return result.valid;
// };

// export function paddingOracle(
// 	ciphertextBlocks: Uint8Array[],
// 	key: Uint8Array,
// 	settings: typeof settingsState
// ) {

// 	const padder = getPadder(settings.paddingScheme);
// 	const decrypted = decryptCBCWithContext(ciphertextBlocks, key, settingsState);
// 	const lastBlock = decrypted[decrypted.length - 1];

// 	const result = padder.validatePadding(lastBlock);
// 	paddingValidation = result;

// 	return result.valid;
// }
