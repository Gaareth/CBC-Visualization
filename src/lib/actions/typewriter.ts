// typewriter.ts
export function typewriter(
	node: HTMLElement,
	params: { typingDelay?: number; initialDelay?: number } = {}
) {
	const { typingDelay = 40, initialDelay = 0 } = params;
	const text = node.textContent ?? '';
	let index = 0;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let frameId: ReturnType<typeof setTimeout> | null = null;

	let originalHeight = node.clientHeight;

	node.textContent = '';
	node.style.visibility = 'visible'; // unhide if you default to hidden

	// to prevent layout shift, set the height to the original height before content is set to empty
	node.style.minHeight = originalHeight + 'px';

	function tick() {
		if (index <= text.length) {
			node.textContent = text.slice(0, index);
			index++;
			frameId = setTimeout(tick, typingDelay);
		}
	}

	const isReduced = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

	if (!isReduced) {
		timeoutId = setTimeout(tick, initialDelay);
	} else {
		node.textContent = text;
	}

	return {
		update(newParams: { typingDelay?: number; initialDelay?: number }) {
			// If you want dynamic params, restart here
		},
		destroy() {
			if (timeoutId) clearTimeout(timeoutId);
			if (frameId) clearTimeout(frameId);
		}
	};
}
