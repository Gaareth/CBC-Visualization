
export interface Padder {
	pad(input: Uint8Array, blockSize: number): Uint8Array[];
	validatePadding(input: Uint8Array): {
		valid: boolean;
		invalidIndices: number[];
		message: string;
	};
	// unpad(input: number[], blockSize: number): number[];
}

