import { describe, expect, it } from 'vitest';
import { TeaCipher } from './cipherTEA';

describe('TEA encryption', () => {
	it('should correctly encrypt', () => {
		const teaCipher = new TeaCipher();
		const v = new Uint32Array([1234567, 671991]);
		const k = new Uint32Array([1151515, 98158, 791045, 901055]);
		const result = teaCipher._encrypt(v, k);

		expect(result).toEqual(new Uint32Array([3389272701, 685433993]));
	});

	it('should correctly decrypt', () => {
		const teaCipher = new TeaCipher();
		const v = new Uint32Array([3389272701, 685433993]);
		const k = new Uint32Array([1151515, 98158, 791045, 901055]);
		const result = teaCipher._decrypt(v, k);

		expect(result).toEqual(new Uint32Array([1234567, 671991]));
	});
});
