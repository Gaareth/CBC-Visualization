export async function delay(milliseconds: number = 1000) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createGate() {
	let resolver: (() => void) | null = null;

	function wait() {
		return new Promise<void>((resolve) => {
			resolver = resolve;
		});
	}

	function step() {
		if (resolver) {
			resolver();
			resolver = null;
		}
	}

	return { wait, step };
}

// default arg for when no stepping is desired
export const autoGate = {
	wait: async () => {} // resolves immediately
};


export function autoRunGate(
	gate: ReturnType<typeof createGate>,
	getDelay: (step: number) => number = () => 300
) {
	let step = 0;
	let stopped = false;
	let timeoutId: ReturnType<typeof setTimeout>;

	function loop() {
		if (stopped) return;

		gate.step();
		step++;

		const delay = Math.max(0, getDelay(step));
		timeoutId = setTimeout(loop, delay);
	}

	loop();

	return () => {
		stopped = true;
		clearTimeout(timeoutId);
	};
}


