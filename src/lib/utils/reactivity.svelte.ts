import { untrack } from 'svelte';

/// https://github.com/sveltejs/svelte/discussions/14220
// export function watch(
// 	getter: () => unknown,
// 	effectCallback: (previous: unknown) => void | (() => void)
// ) {
// 	let previous: unknown = undefined;
// 	$effect(() => {
// 		const current = getter(); // add $state.snapshot for deep reactivity
// 		const cleanup = effectCallback(previous);
// 		previous = current;

// 		return cleanup;
// 	});
// }

export function watch(getter: () => unknown, callback: (previous: unknown) => void) {
	let prev = getter();

	$effect(() => {
		const val = getter();
		untrack(() => {
			callback(prev);
			prev = val;
		});
	});
}

export function usePrevious(getter: () => unknown) {
	let current = $state(getter());
	let previous = $state(null as unknown);

	$effect(() => {
		const val = getter();
		untrack(() => {
			previous = current;
			current = val;
		});
	});

	return {
		get current() {
			return current;
		},
		get previous() {
			return previous;
		}
	};
}

export function updateBlock(
	blocks: number[][],
	blockIndex: number,
	modifierFn?: (block: number[]) => void
): number[][] {
	const newBlocks = blocks.map((b, i) => (i === blockIndex ? [...b] : b));
	if (modifierFn) modifierFn(newBlocks[blockIndex]);
	return newBlocks;
}

export function cloneBlocks(blocks: number[][]): number[][] {
	return blocks.map((block) => [...block]);
}

export function updateInnerIndex(
	blocks: number[][],
	blockIndex: number,
	byteIndex: number,
	newValue: number
): number[][] {
	const newBlocks = [...blocks]; // new outer array
	const newBlock = [...newBlocks[blockIndex]]; // new inner array

	newBlock[byteIndex] = newValue;
	newBlocks[blockIndex] = newBlock;

	return newBlocks;
}
