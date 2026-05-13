export type UIBlock = (number | undefined)[];

/**
 * Converts a Uint8Array back into the format your UI components expect.
 */
export function uint8ArrayToUI(input: Uint8Array): UIBlock {
	// This is simple: Array.from converts the TypedArray to a standard number array
	return Array.from(input);
}

/**
 *  Wraps an onChange handler to convert the UI's (number | undefined)[] back into a Uint8Array for your logic to consume.
 */
export function wrapOnChange(handler?: (bytes: Uint8Array) => void) {
	return (bytes: UIBlock) => {
		if (handler) {
			handler(new Uint8Array(bytes.map((b) => b ?? 0)));
		}
	};
}
