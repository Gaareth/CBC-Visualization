<script lang="ts">
	import { cn } from '../../utils/styling';
	import CBCBlock from './CBCBlock.svelte';
	import type { Padder } from '../../logic/padding/padding';
	import { getGapToNext } from '$lib/stores/cbcConstants.svelte';

	interface Props {
		plaintextBlocks: Uint8Array[];
		ciphertextBlocks: Uint8Array[];

		encryptionMode?: boolean;
		onChangeIV?: (bytes: Uint8Array) => void;
		onPlaintextChange?: (blocks: Uint8Array[]) => void;
		onCiphertextChange?: (blocks: Uint8Array[]) => void;

		padder?: Padder;
		addInitPadding?: boolean;
	}

	let {
		plaintextBlocks = $bindable(),
		ciphertextBlocks = $bindable(),
		onChangeIV,
		onPlaintextChange,
		onCiphertextChange,

		encryptionMode = true,
		padder,
		addInitPadding = false
	}: Props = $props();


	let targetRotation = $derived(encryptionMode ? 90 : 270);

	export function rotateArrows() {
		targetRotation += 180;
	}

	const isLastBlock = $derived((i: number) => i === plaintextBlocks.length - 1);
</script>


<div class={cn('flex justify-center')} style={`gap: ${getGapToNext()}px;`}>
	{#each { length: plaintextBlocks.length } as _, i}
		<CBCBlock
			{encryptionMode}
			{targetRotation}
			index={i}
			plaintextBlock={plaintextBlocks[i]}
			ciphertextBlock={ciphertextBlocks[i + 1]}
			initializationVector={i === 0 ? ciphertextBlocks[0] : undefined}
			isLastBlock={isLastBlock(i)}
			onChangeCiphertext={(bytes) => {
				ciphertextBlocks[i + 1] = bytes;
				onCiphertextChange?.(ciphertextBlocks);
			}}
			onChangePlaintext={(bytes) => {
				plaintextBlocks[i] = bytes;
				plaintextBlocks = [...plaintextBlocks];
				onPlaintextChange?.(plaintextBlocks);
			}}
			onChangeIV={(bytes) => {
				// ciphertextBlocks[0] = bytes;
				// ciphertextBlocks = [...ciphertextBlocks];
				onChangeIV?.(bytes);
			}}
			{padder}
			addInitPadding={addInitPadding && i === 0}
		/>
	{/each}
</div>
