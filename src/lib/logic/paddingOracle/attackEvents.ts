type BeforeEdgeCaseCheck = {
	event: 'edge-case-check';
};
type EdgeCaseCheckResult = {
	event: 'edge-case-check-result';
	data: {
		paddingValid: boolean;
	};
};

export type OnByteRecovered = {
	event: 'on-byte-recovered';
	data?: {
		expectedPlaintextByte?: number;
	};
};

export type ByteRecoveredResult = {
	event: 'byte-recovered-result';
	data: {
		guessedByte: number;
		decByte: number;
		guess: number;
		originalIVByte: number;
		decByteXoredWith: number;
	};
};

type OnByteStart = {
	event: 'on-byte-start';
};

type OnBlockStart = {
	event: 'on-block-start';
};

type OnByteEnd = {
	event: 'on-byte-end';
};

type OnBlockEnd = {
	event: 'on-block-end';
	data: {
		blockIndex: number;
	};
};

type AfterSetPaddingBytes = {
	event: 'after-set-padding-bytes';
	data: {
		byte: number;
	};
};

export type AttackEvent =
	| BeforeEdgeCaseCheck
	| EdgeCaseCheckResult
	| ByteRecoveredResult
	| OnByteRecovered
	| OnByteStart
	| AfterSetPaddingBytes
	| OnBlockStart
	| OnByteEnd
	| OnBlockEnd;
