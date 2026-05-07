

export function encryptCBC(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array) {
	const cipherFn = getBlockCipherFn(settingsState.blockCipher);
	const padder = getPadder(settingsState.paddingScheme);

	return cbcEncrypt(plaintext, key, iv, cipherFn, padder);
}

export function decryptCBC(ciphertext: Uint8Array[], key: Uint8Array) {
	const cipherFn = getBlockCipherFn(settingsState.blockCipher);

	return cbcDecrypt(ciphertext, key, cipherFn);
}