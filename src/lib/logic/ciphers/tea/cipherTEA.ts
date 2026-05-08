import { generateKeyFromString, toUint32 } from '../../crypto-utils';

export class TeaCipher implements Cipher {
	public keySizeBytes: number = 16;
	public blockSizeBytes: number = 8;

	numRounds: number = 32;

	public constructor(numRounds?: number) {
		if (numRounds) {
			this.numRounds = numRounds;
		}
	}

	private _validateInput(v: Uint32Array, k: Uint32Array) {
		if (v.length !== 2) {
			throw new Error('plaintext must have size 2');
		}

		if (k.length !== 4) {
			throw new Error('key must have size 4');
		}
	}

	public _encrypt = (v: Uint32Array, k: Uint32Array): Uint32Array => {
		this._validateInput(v, k);

		let sum = toUint32(0);
		let delta = toUint32(0x9e3779b9);

		for (let i = 0; i < this.numRounds; i++) {
			sum = toUint32(sum + delta);
			v[0] += ((v[1] << 4) + k[0]) ^ (v[1] + sum) ^ ((v[1] >>> 5) + k[1]);
			v[1] += ((v[0] << 4) + k[2]) ^ (v[0] + sum) ^ ((v[0] >>> 5) + k[3]);
		}

		return v;
	};

	public _decrypt = (v: Uint32Array, k: Uint32Array): Uint32Array => {
		this._validateInput(v, k);

		let delta = toUint32(0x9e3779b9);
		let sum = toUint32((delta << 5) & 0xffffffff);

		for (let i = 0; i < this.numRounds; i++) {
			v[1] -= ((v[0] << 4) + k[2]) ^ (v[0] + sum) ^ ((v[0] >>> 5) + k[3]);
			v[0] -= ((v[1] << 4) + k[0]) ^ (v[1] + sum) ^ ((v[1] >>> 5) + k[1]);
			sum = toUint32(sum - delta);
		}

		return v;
	};

	private From8To32 = (
		plaintext: Uint8Array,
		key: Uint8Array,
		fn: (v: Uint32Array, k: Uint32Array) => Uint32Array
	): Uint8Array => {
		if (plaintext.length !== this.blockSizeBytes) {
			throw new Error(`plaintext must be a block of size ${this.blockSizeBytes}`);
		}

		if (key.length !== this.keySizeBytes) {
			throw new Error(`key must be a block of size ${this.keySizeBytes}`);
		}

		const plaintext32 = new Uint32Array(plaintext.buffer);
		const key32 = new Uint32Array(key.buffer);
		const result = fn(plaintext32, key32);
		return new Uint8Array(result.buffer);
	};

	public encrypt = (plaintext: Uint8Array, key: Uint8Array): Uint8Array => {
		return this.From8To32(plaintext, key, this._encrypt);
	};

	public decrypt = (ciphertext: Uint8Array, key: Uint8Array): Uint8Array => {
		return this.From8To32(ciphertext, key, this._decrypt);
	};

	public generateKey = (): Uint8Array => {
		const key = new Uint8Array(this.keySizeBytes);
		crypto.getRandomValues(key);
		return key;
	};

	public getFixedKey = (): Uint8Array => {
		return generateKeyFromString('simpleEncryption', this.keySizeBytes);
	};
}
