<script lang="ts">
	interface Props {
		onClick?: () => void;
		onHoldStart?: () => void;
		onHoldEnd?: () => void;
		onHoldTick?: () => void;
		holdDelay?: number;
		repeat?: number;
		disabled?: boolean;
		children?: any;
		[key: string]: any; // for any additional props like id, etc.
	}

	let {
		onClick,
		onHoldStart,
		onHoldEnd,
		onHoldTick,
		holdDelay = 150, // ms until hold starts
		repeat = 100, // ms interval while holding
		disabled = false,
		children,
		...restProps
	}: Props = $props();

	let pressed = $state(false);
	let holdTimeout: ReturnType<typeof setTimeout> | null = null;
	let repeatInterval: ReturnType<typeof setInterval> | null = null;
	let holding = $state(false);

	function startPress() {
		if (disabled) return;

		pressed = true;

		// wait before entering hold mode, to not instantly trigger on simple click
		holdTimeout = setTimeout(() => {
			holding = true;
			onHoldStart?.();

			if (onHoldTick) {
				repeatInterval = setInterval(() => {
					onHoldTick();
				}, repeat);
			}
		}, holdDelay);
	}

	function endPress() {
		if (!pressed) return;

		pressed = false;

		if (holdTimeout) {
			clearTimeout(holdTimeout);
			holdTimeout = null;
		}

		if (repeatInterval) {
			clearInterval(repeatInterval);
			repeatInterval = null;
		}

		// if we never entered hold → treat as click
		if (!holding) onClick?.();

		if (holding) onHoldEnd?.();
		holding = false;
	}
</script>

<button
	class:pressed
	{disabled}
	onpointerdown={startPress}
	onpointerup={endPress}
	onpointerleave={endPress}
	onpointercancel={endPress}
	{...restProps}
>
	{@render children?.()}
</button>

<style>
	button.pressed {
		transform: scale(0.96);
	}
</style>
