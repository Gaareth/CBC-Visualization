export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

export function rotatedBoundingBox(width: number, height: number, rotationDeg: number) {
	const r = degToRad(rotationDeg);

	const rotatedWidth = Math.abs(height * Math.cos(r)) + Math.abs(width * Math.sin(r));

	const rotatedHeight = Math.abs(height * Math.sin(r)) + Math.abs(width * Math.cos(r));

	return {
		width: rotatedWidth,
		height: rotatedHeight
	};
}

export function getRandomByteExcept(exceptions: number[] = []): number {
	let options = Array.from({ length: 256 }, (_, i) => i).filter((i) => !exceptions.includes(i));
	return options[Math.floor(Math.random() * options.length)];
}
