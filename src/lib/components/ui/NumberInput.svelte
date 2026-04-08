<script lang="ts">
	import { cn } from '../../utils/styling';

	interface Props {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		className?: string;
		onChange?: (value: number) => void;
		surfaceLevel?: number;
	}

	let {
		value = $bindable(0),
		min = -Infinity,
		max = Infinity,
		step = 1,
		className = '',
		surfaceLevel = 0,
		onChange
	}: Props = $props();

	function increment() {
		if (value + step <= max) {
			value += step;
			onChange?.(value);
		}
	}

	function decrement() {
		if (value - step >= min) {
			value -= step;
			onChange?.(value);
		}
	}

	function onInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const num = parseFloat(input.value);
		if (!isNaN(num)) {
			value = Math.min(Math.max(num, min), max);
			onChange?.(value);
		}
	}

	const surfaces = {
		0: 'bg-transparent',
		1: 'bg-gray-50 border-default shadow-lg dark:bg-surface-a10 dark:border-surface-a20  dark:hover:bg-surface-a20',
		2: 'bg-gray-100 border-default shadow-xl dark:bg-surface-a20 dark:border-surface-a30 dark:hover:bg-surface-a30',
		3: 'bg-gray-200 border-default shadow-2xl dark:bg-surface-a30 dark:border-surface-a40 dark:hover:bg-surface-a40',
		4: 'bg-white border-default shadow-2xl dark:bg-surface-a40 dark:border-surface-a50 dark:hover:bg-surface-a50'
	} as const;

	let surfaceClass = $derived(surfaces[surfaceLevel as keyof typeof surfaces] ?? surfaces[1]);
</script>

<div class={cn('flex', className)}>
	<button
		type="button"
		onclick={decrement}
		class={cn('w-full input-default px-2', surfaceClass)}
		disabled={value <= min}
	>
		-
	</button>
	<input
		{value}
		type="number"
		oninput={onInput}
		{min}
		{max}
		{step}
		class={cn('z-10 w-full input-default border-s-0 border-e-0 px-2 text-center', surfaceClass)}
	/>
	<button
		type="button"
		onclick={increment}
		class={cn('w-full input-default px-2', surfaceClass)}
		disabled={value >= max}
	>
		+
	</button>
</div>

<style>
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		/* display: none; <- Crashes Chrome on hover */
		-webkit-appearance: none;
		margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
	}

	input[type='number'] {
		-moz-appearance: textfield; /* Firefox */
	}
</style>
