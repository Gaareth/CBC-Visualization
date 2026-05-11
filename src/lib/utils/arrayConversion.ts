/**
 * Converts a Uint8Array back into the format your UI components expect.
 */
export function uint8ArrayToUI(input: Uint8Array): (number | undefined)[] {
	// This is simple: Array.from converts the TypedArray to a standard number array
	return Array.from(input);
}

/**
 * If you need to break it back into chunks for the UI grid:
 */
export function uint8ArrayToUIBlocks(input: Uint8Array, blockSize: number): number[][] {
	const blocks: number[][] = [];
	for (let i = 0; i < input.length; i += blockSize) {
		blocks.push(Array.from(input.subarray(i, i + blockSize)));
	}
	return blocks;
}

/**
 *  Wraps an onChange handler to convert the UI's (number | undefined)[] back into a Uint8Array for your logic to consume.
 */
export function wrapOnChange(handler?: (bytes: Uint8Array) => void) {
	return (bytes: (number | undefined)[]) => {
		if (handler) {
			handler(new Uint8Array(bytes.map((b) => b ?? 0)));
		}
	};
}
