<script lang="ts">
	import { CBC_LAYOUT } from '$lib/stores/cbcConstants.svelte';
	import { settingsState } from '../../stores/settings.svelte';
	import { displayByte } from '../../utils/compute';
	import { watch } from '../../utils/reactivity.svelte';
	import { cn, inputLayer, type SurfaceLevel } from '../../utils/styling';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		title?: string;
		textPosBelow?: boolean;
		classNameTextAbove?: string;
		bytes: (number | undefined)[];
		byteWidth?: number; // in pixels
		byteHeight?: number; // in pixels
		className?: string;
		error?: {
			message: string;
			indices: number[];
		};
		reserveSpaceForError?: boolean;

		success?: boolean;
		displayAs?: 'hex' | 'ascii' | 'decimal';
		onChange?: (bytes: (number | undefined)[]) => void;
		allowEdit?: boolean;
		highlightChanges?: boolean;
		inputClassNames?: Record<number, string>;
		surfaceLevel?: SurfaceLevel;
	}

	let {
		title,
		textPosBelow = false,
		classNameTextAbove = '',
		bytes,
		className = '',
		byteWidth = CBC_LAYOUT.byteWidth,
		byteHeight = CBC_LAYOUT.byteHeight,
		error,
		reserveSpaceForError = false,
		success,
		displayAs: displayAsProp,
		onChange,
		allowEdit = false,
		highlightChanges: highlightChangesProp,
		inputClassNames,
		surfaceLevel = 1
	}: Props = $props();

	let highlightChanges = $derived.by(() => {
		if (highlightChangesProp !== undefined) return highlightChangesProp;
		return settingsState.highlightChanges;
	});

	let displayAs = $derived.by(() => {
		if (displayAsProp) return displayAsProp;
		return settingsState.displayBytesAs;
	});

	let displayBytes: string[] = $derived(
		bytes.map((b) => {
			return displayByte(b, displayAs);
		})
	);

	function updateBytes(index: number, value: number) {
		// bytes = [...bytes.slice(0, index), value, ...bytes.slice(index + 1)];
		// if (onChange) {
		// 	onChange(bytes);
		// }
		// bytes[index] = value;
		// bytes = [...bytes];
		const mutatedBytes = bytes.slice();
		mutatedBytes[index] = value;
		onChange?.(mutatedBytes);
	}

	function parseValue(value: string) {
		switch (displayAs) {
			case 'hex':
				return parseInt(value, 16) || 0;
			case 'decimal':
				return parseInt(value, 10) || 0;
			case 'ascii':
				return value.charCodeAt(0) || 0;
			default:
				return parseInt(value, 16) || 0;
		}
	}

	function validateInput(event: Event, index: number) {
		const target = event.target as HTMLInputElement;
		let value;

		switch (displayAs) {
			case 'hex':
				value = target.value.toUpperCase().replace(/[^0-9A-F]/g, '');
				if (value.length > 2) {
					value = value.slice(0, 2);
				}
				break;
			case 'decimal':
				value = target.value.replace(/[^0-9]/g, '');
				if (value.length > 3) {
					value = value.slice(0, 3);
				}
				if (parseInt(value) > 255) {
					value = '255';
				}
				break;
			case 'ascii':
				value = target.value.charAt(0);
				break;
		}

		target.value = value;

		updateBytes(index, parseValue(value));
	}

	function onkeypress(event: KeyboardEvent, index: number) {
		let currentValue = bytes[index] || 0;
		// const target = event.target as HTMLInputElement;

		if (event.key == 'ArrowUp') {
			const newValue = (currentValue + 1) % 256;
			// target.value = newValue;

			updateBytes(index, newValue);
		}

		if (event.key == 'ArrowDown') {
			let newValue = (currentValue - 1) % 256;
			if (newValue < 0) newValue += 256; // Handle negative wrap-around
			// target.value = newValue;

			updateBytes(index, newValue);
		}
	}

	let flashIndices = new SvelteSet();

	let previous = $state(null as (number | undefined)[] | null);

	watch(
		// () => {
		// 	if (bytes != null) {
		// 		[...bytes];
		// 	} else {
		// 		[];
		// 	}
		// },
		() => [...bytes],
		(prev) => {
			previous = prev as (number | undefined)[];
			if (!highlightChanges || !previous) return;

			for (let i = 0; i < bytes.length; i++) {
				const currentByte = bytes[i];
				const previousByte = previous[i];

				if (previousByte !== undefined && currentByte !== previousByte) {
					flashIndices.add(i);

					setTimeout(() => {
						flashIndices.delete(i);
					}, 300); // adjust delay
				}
			}
		}
	);
</script>

<div class={cn('relative flex flex-col gap-2 text-center', className)} style:width={`${bytes.length * (byteWidth)}px`}>
	<!-- <p>{previous}</p>
	<p>{[...flashIndices]}</p> -->
	<!-- {#if error}
		<p class="text-error">{error.message}</p>
	{/if} -->

	<!-- h-5 -->
	{#if !textPosBelow && reserveSpaceForError}
		<div class={cn('w-full', classNameTextAbove)}>
			{#if title}
				<p >{title}</p>
			{/if}

			{#if error}
				<p class="text-error break-all w-full">{error.message}</p>
			{/if}
		</div>
	{/if}

	<div class="flex">
		{#each bytes as byte, i}
			<input
				disabled={!allowEdit}
				onkeydown={(e) => onkeypress(e, i)}
				oninput={(e) => validateInput(e, i)}
				type="text"
				class={cn(
					'input-group-item number-input-no-spin text-center',
					error?.indices.includes(i + 1) ? 'border-e-0' : '',
					error?.indices.includes(i) ? 'border-s border-error' : '',
					success ? 'border-success' : '',
					flashIndices.has(i) ? 'z-10 opacity-100! ring-2 ring-primary-0 ring-offset-1' : '',
					'transition-all duration-300 ease-out',
					inputClassNames?.[i] || '',
					inputLayer[surfaceLevel]
				)}
				value={displayBytes[i]}
				style:width={`${byteWidth}px`}
				style:height={`${byteHeight}px`}
				title={error?.indices.includes(i) ? error.message : undefined}
			/>
		{/each}
	</div>

	{#if textPosBelow && reserveSpaceForError}
		<div class="h-5 w-full">
			{#if title}
				<p>{title}</p>
			{/if}

			{#if error}
				<p class="text-error break-all w-full">{error.message}</p>
			{/if}
		</div>
	{/if}
</div>
