// ---- Inputs ----

export const CBC_LAYOUT = $state({
	blockSize: 8,
	arrowWidth: 75,
	arrowThickness: 3,
	arrowHeadWidth: 15,
	byteWidth: 40,
	byteHeight: 32,
	gap: 6,
	xorDiameter: 24,
	functionHeight: 40
});

// ---- Derived values ----
export function getBlockWidth() {
	return CBC_LAYOUT.blockSize * CBC_LAYOUT.byteWidth;
}

export function getGapToNext() {
	return getBlockWidth() / 5;
}

export function getToMidLength() {
	return getBlockWidth() / 2 + getGapToNext() / 2;
}

// distance from middle arrow to XOR circle
export function getToXorLength() {
	return (
		CBC_LAYOUT.arrowWidth / 2 +
		CBC_LAYOUT.gap +
		CBC_LAYOUT.functionHeight +
		CBC_LAYOUT.gap +
		CBC_LAYOUT.arrowWidth +
		CBC_LAYOUT.gap +
		CBC_LAYOUT.arrowThickness / 2 +
		CBC_LAYOUT.xorDiameter / 2 +
		CBC_LAYOUT.arrowThickness / 2
	);
}

// left side layout sizing
export function getIvWidth() {
	return getBlockWidth();
}

export function getLeftSize() {
	return (
		getIvWidth() +
		CBC_LAYOUT.gap +
		CBC_LAYOUT.arrowWidth +
		CBC_LAYOUT.gap +
		CBC_LAYOUT.xorDiameter / 2
	);
}

export function getLeftPadding() {
	return getLeftSize() - getBlockWidth() / 2;
}
