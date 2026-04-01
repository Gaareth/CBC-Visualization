<script lang="ts">
	import { STYLE_CONSTANTS } from './CBCBlock.svelte';
	import { cn } from './utils/styling';

	interface Props {
		title?: string;
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
	}

	let {
		title,
		bytes,
		className = '',
		byteWidth = STYLE_CONSTANTS.byteWidth,
		byteHeight = STYLE_CONSTANTS.byteHeight,
		error,
		reserveSpaceForError = false,
		success,
		displayAs = 'hex',
		onChange,
		allowEdit = false
	}: Props = $props();

	let displayBytes: string[] = $derived(
		bytes.map((b) => {
			if (b == null) {
				return '?';
			}

			switch (displayAs) {
				case 'hex':
					return b.toString(16).toUpperCase().padStart(2, '0');
				case 'ascii':
					return String.fromCharCode(b);
				case 'decimal':
					return b.toString(10);
				default:
					return b.toString(16).toUpperCase().padStart(2, '0');
			}
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
</script>

<div class={cn('flex flex-col text-center', className)}>
	<!-- {#if error}
		<p class="text-error">{error.message}</p>
	{/if} -->
	<div class="flex">
		{#each bytes as byte, i}
			<!-- <div class="flex h-8 w-8 items-center justify-center border-default border-e-0 last:border-e">
				{byte.toString(16).padStart(2, '0')}
			</div> -->

			<input
				disabled={!allowEdit}
				onkeydown={(e) => onkeypress(e, i)}
				oninput={(e) => validateInput(e, i)}
				type="text"
				class={cn(
					'input-group-item number-input-no-spin text-center',
					error?.indices.includes(i + 1) ? 'border-e-0' : '',
					error?.indices.includes(i) ? 'border-s border-error' : '',
					success ? 'border-success' : ''
				)}
				value={displayBytes[i]}
				style:width={`${byteWidth}px`}
				style:height={`${byteHeight}px`}
				title={error?.indices.includes(i) ? error.message : undefined}
			/>
		{/each}
	</div>

	{#if reserveSpaceForError}
		<div class="h-5">
			{#if title}
				<p>{title}</p>
			{/if}

			{#if error}
				<p class="text-error">{error.message}</p>
			{/if}
		</div>
	{/if}
</div>
