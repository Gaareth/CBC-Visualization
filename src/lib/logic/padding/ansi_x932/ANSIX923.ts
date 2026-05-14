import { AbstractBlockPadder } from '../AbstractBlockPadder';

export abstract class ANSIX923Padder extends AbstractBlockPadder {
	protected abstract fillBlock(length: number): Uint8Array;

	protected constructPaddingBlock(paddingLength: number): Uint8Array {
		const paddingBlock = this.fillBlock(paddingLength);
		paddingBlock[paddingLength - 1] = paddingLength;
		return paddingBlock;
	}

	protected abstract validatePaddingFillValues(input: Uint8Array, paddingLength: number): number[];

	validatePadding(input: Uint8Array): {
		valid: boolean;
		invalidIndices: number[];
		message: string;
	} {
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

		const invalidPaddingIndices = this.validatePaddingFillValues(input, paddingLength);

		return {
			valid: invalidPaddingIndices.length === 0,
			invalidIndices: invalidPaddingIndices,
			message: `Expected ${paddingLength} bytes of value 0x00.`
		};
	}
}

export class ANSIX923ZeroPadder extends ANSIX923Padder {
	protected fillBlock(paddingLength: number): Uint8Array {
		return new Uint8Array(paddingLength).fill(0x00);
	}

	protected validatePaddingFillValues(input: Uint8Array, paddingLength: number): number[] {
		const invalidPaddingIndices = [];
		for (let i = input.length - paddingLength; i < input.length - 1; i++) {
			if (input[i] !== 0x00) {
				invalidPaddingIndices.push(i);
			}
		}
		return invalidPaddingIndices;
	}
}

type RandomFn = (len: number) => Uint8Array;
export class ANSIX923RandomPadder extends ANSIX923Padder {
	constructor(private random: RandomFn) {
		super();
	}

	protected fillBlock(paddingLength: number): Uint8Array {
		return this.random(paddingLength);
	}

	
	protected validatePaddingFillValues(_input: Uint8Array, _paddingLength: number): number[] {
		// For random padding, we can't validate the actual values, so we just return an empty array.
		return [];
	}
}
