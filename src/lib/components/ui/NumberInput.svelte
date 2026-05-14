<script lang="ts">
	import { cn, inputLayer, type SurfaceLevel } from '../../utils/styling';
	import HoldableButton from './HoldableButton.svelte';

	interface Props {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		className?: string;
		onChange?: (value: number) => void;
		surfaceLevel?: SurfaceLevel;
		[key: string]: unknown; // for any additional props like id, etc.
	}

	let {
		value = $bindable(0),
		min = -Infinity,
		max = Infinity,
		step = 1,
		className = '',
		surfaceLevel = 1,
		onChange,
		...restProps
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

	let surfaceClass = $derived(inputLayer[surfaceLevel]);
</script>

<div class={cn('flex', className)}>
	<HoldableButton
		type="button"
		onClick={decrement}
		onHoldTick={decrement}
		class={cn('input-default w-full px-2', surfaceClass)}
		disabled={value <= min}
	>
		-
	</HoldableButton>
	<input
		{value}
		type="number"
		oninput={onInput}
		{min}
		{max}
		{step}
		class={cn('input-default z-10 w-full border-s-0! border-e-0! px-2 text-center', surfaceClass)}
		{...restProps}
	/>
	<HoldableButton
		type="button"
		onclick={increment}
		onHoldTick={increment}
		class={cn('input-default w-full px-2', surfaceClass)}
		disabled={value >= max}
	>
		+
	</HoldableButton>
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
		appearance: textfield;
	}
</style>
