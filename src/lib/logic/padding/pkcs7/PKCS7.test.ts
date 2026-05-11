import { describe, expect, it } from 'vitest';
import { PKCS7Padder } from './PKCS7';

describe('PKCS7 padding', () => {
	it('should correctly padd empty blocks', () => {
		const padder = new PKCS7Padder();
		const blockSize = 16;
		const emptyBlock = new Uint8Array([]);
		const padding = padder.pad(emptyBlock, blockSize);
		const fullPadding = new Uint8Array(blockSize).fill(blockSize);
		expect(padding).toEqual([fullPadding]);
	});

	it('should correctly padd with the remaining blocksize', () => {
		const padder = new PKCS7Padder();
		const blockSize = 16;
		const expectedPaddingSize = 5;

		const block = new Uint8Array(blockSize - expectedPaddingSize).fill(Math.random() * 255);
		const padding = padder.pad(block, blockSize);

		const expectedPadded = new Uint8Array([
			...block,
			...new Uint8Array(expectedPaddingSize).fill(expectedPaddingSize)
		]);
		expect(padding).toEqual([expectedPadded]);
	});

	it('should correctly padd multiple blocks', () => {
		const padder = new PKCS7Padder();
		const blockSize = 16;
		const expectedPaddingSize = 5;

		const fullBlock = new Uint8Array(blockSize);
		const openBlock = new Uint8Array(blockSize - expectedPaddingSize).fill(Math.random() * 255);
		const block = new Uint8Array([...fullBlock, ...openBlock]);
		const padding = padder.pad(block, blockSize);

		const expectedPadded = new Uint8Array([
			...openBlock,
			...new Uint8Array(expectedPaddingSize).fill(expectedPaddingSize)
		]);
		expect(padding).toEqual([fullBlock, expectedPadded]);
	});

	it('should correctly padd a full block', () => {
		const padder = new PKCS7Padder();
		const blockSize = 16;
		const fullBlock = new Uint8Array(16);
		const padding = padder.pad(fullBlock, blockSize);
		console.log(padding);

		const fullPadding = new Uint8Array(blockSize).fill(blockSize);
		expect(padding).toEqual([fullBlock, fullPadding]);
	});

	it('should correctly validate a valid block', () => {
		const padder = new PKCS7Padder();

		let validBlock = new Uint8Array([0xaa, 0xbb, 0xcc, 0x01]);
		expect(padder.validatePadding(validBlock).valid).toBe(true);

		validBlock = new Uint8Array([0xaa, 0xbb, 0x02, 0x02]);
		expect(padder.validatePadding(validBlock).valid).toBe(true);

		validBlock = new Uint8Array([0xaa, 0x03, 0x03, 0x03]);
		expect(padder.validatePadding(validBlock).valid).toBe(true);

		validBlock = new Uint8Array([0x04, 0x04, 0x04, 0x04]);
		expect(padder.validatePadding(validBlock).valid).toBe(true);
	});

	it('should not validate an invalid block', () => {
		const padder = new PKCS7Padder();

		const invalidBlock = new Uint8Array([0xaa, 0xbb, 0xcc, 0x03]);

		const validation = padder.validatePadding(invalidBlock);
		expect(validation.valid).toBe(false);
		expect(validation.invalidIndices).toEqual([1, 2]);
	});
});
