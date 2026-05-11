import { displayByte } from '$lib/utils/compute';
import { AbstractBlockPadder } from '../AbstractBlockPadder';

export class PKCS7Padder extends AbstractBlockPadder {
	protected constructPaddingBlock(paddingLength: number): Uint8Array {
		return new Uint8Array(paddingLength).fill(paddingLength);
	}

	validatePadding(input: Uint8Array) {
		const blockSize = input.length;
		const paddingLength = input[input.length - 1];

		const paddingValidation = super.validatePaddingLength(paddingLength, blockSize);
		if (!paddingValidation.valid) {
			return {
				valid: false,
				invalidIndices: paddingValidation.invalidIndices!,
				message: paddingValidation.message!
			};
		}

		const invalidPaddingIndices = [];
		for (let i = input.length - paddingLength; i <= input.length - 1; i++) {
			if (input[i] !== paddingLength) {
				invalidPaddingIndices.push(i);
			}
		}

		return {
			valid: invalidPaddingIndices.length === 0,
			invalidIndices: invalidPaddingIndices,
			message: `Expected ${paddingLength} bytes of value 0x${displayByte(paddingLength, 'hex')}.`
		};
	}
}
