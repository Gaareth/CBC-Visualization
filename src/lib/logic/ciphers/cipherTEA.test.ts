import { describe, expect, it } from 'vitest';
import { _encrypt, _decrypt, encrypt } from './cipherTEA';

describe('TEA encryption', () => {
	it('should correctly encrypt', () => {
		const v = new Uint32Array([1234567, 671991]);
		const k = new Uint32Array([1151515, 98158, 791045, 901055]);
		const result = _encrypt(v, k);

		expect(result).toEqual(new Uint32Array([3389272701, 685433993]));
	});

	it('should correctly decrypt', () => {
		const v = new Uint32Array([3389272701, 685433993]);
		const k = new Uint32Array([1151515, 98158, 791045, 901055]);
		const result = _decrypt(v, k);

		expect(result).toEqual(new Uint32Array([1234567, 671991]));
	});
});
