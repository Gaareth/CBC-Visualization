export type PaddingValidationResult = {
	valid: boolean;
	invalidIndices: number[];
	message: string;
};

export interface Padder {
	pad(input: Uint8Array, blockSize: number): Uint8Array[];
	validatePadding(input: Uint8Array): PaddingValidationResult;
	// unpad(input: number[], blockSize: number): number[];
}
