<script lang="ts">
	import { cn } from '../../utils/styling';
	import CBCBlock from './CBCBlock.svelte';
	import { STYLE_CONSTANTS } from './CBCBlock.svelte';
	import type { Padder } from '../../logic/padding';

	interface Props {
		plaintextBlocks: (number | undefined)[][];
		ciphertextBlocks: (number | undefined)[][];

		encryptionMode?: boolean;
		onIVChange?: (bytes: (number | undefined)[]) => void;
		padder?: Padder;
		addInitPadding?: boolean;
	}

	let {
		plaintextBlocks = $bindable(),
		ciphertextBlocks = $bindable(),
		onIVChange,

		encryptionMode = true,
		padder,
		addInitPadding = false
	}: Props = $props();

	const initializationVector = $derived(ciphertextBlocks[0]);

	let targetRotation = $derived(encryptionMode ? 90 : 270);

	export function rotateArrows() {
		targetRotation += 180;
	}

	const isLastBlock = $derived((i: number) => i === plaintextBlocks.length - 1);
</script>

<div class={cn('flex justify-center')} style={`gap: ${STYLE_CONSTANTS.gapToNext}px;`}>
	{#each { length: plaintextBlocks.length } as _, i}
		<CBCBlock
			{encryptionMode}
			{targetRotation}
			index={i}
			plaintextBlock={plaintextBlocks[i]}
			ciphertextBlock={ciphertextBlocks[i + 1]}
			initializationVector={i === 0 ? ciphertextBlocks[0] : undefined}
			isLastBlock={isLastBlock(i)}
			onChangeCiphertext={(bytes) => (ciphertextBlocks[i + 1] = bytes)}
			onChangePlaintext={(bytes) => {
				plaintextBlocks[i] = bytes;
				plaintextBlocks = [...plaintextBlocks];
			}}
			onChangeIV={(bytes) => {
				// ciphertextBlocks[0] = bytes;
				onIVChange?.(bytes);
			}}
			{padder}
			addInitPadding={addInitPadding && i === 0}
		/>
	{/each}
</div>
