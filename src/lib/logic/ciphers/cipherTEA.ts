import { toUint32 } from '../crypto-utils';
import { PKCS7Padder } from '../padding';

export function _encrypt(v: Uint32Array, k: Uint32Array): Uint32Array {
	if (v.length !== 2) {
		throw new Error('plaintext must have size 2');
	}

	if (k.length !== 4) {
		throw new Error('key must have size 4');
	}

	let sum = toUint32(0);
	let delta = toUint32(0x9e3779b9);

	const NUM_ROUNDS = 32;
	for (let i = 0; i < NUM_ROUNDS; i++) {
		sum = toUint32(sum + delta);
		v[0] += ((v[1] << 4) + k[0]) ^ (v[1] + sum) ^ ((v[1] >>> 5) + k[1]);
		v[1] += ((v[0] << 4) + k[2]) ^ (v[0] + sum) ^ ((v[0] >>> 5) + k[3]);
	}

	return v;
}

export function _decrypt(v: Uint32Array, k: Uint32Array): Uint32Array {
	if (v.length !== 2) {
		throw new Error('plaintext must have size 2');
	}

	if (k.length !== 4) {
		throw new Error('key must have size 4');
	}

	let delta = toUint32(0x9e3779b9);
	let sum = toUint32((delta << 5) & 0xffffffff);

	const NUM_ROUNDS = 32;
	for (let i = 0; i < NUM_ROUNDS; i++) {
		v[1] -= ((v[0] << 4) + k[2]) ^ (v[0] + sum) ^ ((v[0] >>> 5) + k[3]);
		v[0] -= ((v[1] << 4) + k[0]) ^ (v[1] + sum) ^ ((v[1] >>> 5) + k[1]);
		sum = toUint32(sum - delta);
	}

	return v;
}

function From8To32(
	plaintext: Uint8Array,
	key: Uint8Array,
	fn: (v: Uint32Array, k: Uint32Array) => Uint32Array
): Uint8Array {
	if (plaintext.length !== 8) {
		throw new Error('plaintext must have size 8');
	}

	if (key.length !== 16) {
		throw new Error('key must have size 16');
	}

	const plaintext32 = new Uint32Array(plaintext.buffer);
	const key32 = new Uint32Array(key.buffer);
	const result = fn(plaintext32, key32);
	return new Uint8Array(result.buffer);
}

export function encrypt(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
	return From8To32(plaintext, key, _encrypt);
}

export function decrypt(ciphertext: Uint8Array, key: Uint8Array): Uint8Array {
	return From8To32(ciphertext, key, _decrypt);
}

export function generateRandomKey(): Uint8Array {
	const key = new Uint8Array(16);
	crypto.getRandomValues(key);
	return key;
}

export function getFixedKey(): Uint8Array {
	const arr = [];
	const string = 'simpleEncryption';
	for (let char of string) {
		arr.push(char.charCodeAt(0));
	}
	const arrTyped = new Uint8Array(arr);

	const padder = new PKCS7Padder();
	return padder.padd(arrTyped, 16)[0];
}
