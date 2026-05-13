<script lang="ts">
	import ExplainWrapper from '../shared/ExplainWrapper.svelte';
	import { findPaddingLengthWithOracle } from '../../logic/paddingOracle/lengthRecovery';
	import { createGate, autoRunGate } from '../../utils/generic';
	import type { PaddingOracle } from '$lib/logic/paddingOracle';

	interface Props {
		paddingValidation:
			| {
					valid: boolean;
					invalidIndices: number[];
					message: string;
			  }
			| undefined;
		blockSize: number;
		showSuccess: boolean;
		resetCiphertext: () => void;
		paddingOracle: PaddingOracle;
		ciphertextBlocks: Uint8Array[];
		onCiphertextChange?: () => void;
	}

	let {
		paddingValidation,
		blockSize,
		showSuccess = $bindable(false),
		resetCiphertext,
		paddingOracle,
		ciphertextBlocks,
		onCiphertextChange
	}: Props = $props();

	let paddingLengthGate = $state(createGate());
	let paddingLengthAutoRunStopper = $state(undefined as ReturnType<typeof autoRunGate> | undefined);
	let runningIndex = $state(undefined as number | undefined);

	async function recoverPaddingLength() {
		resetCiphertext();

		showSuccess = false;
		runningIndex = 0;
		await findPaddingLengthWithOracle(
			ciphertextBlocks,
			paddingOracle,
			paddingLengthGate,
			onCiphertextChange
		);

		showSuccess = true;

		if (paddingLengthAutoRunStopper) {
			paddingLengthAutoRunStopper();
			paddingLengthAutoRunStopper = undefined;
		}

		// resetCiphertext();
	}

	function reset() {
		runningIndex = undefined;
		showSuccess = false;
		paddingLengthAutoRunStopper?.();
		paddingLengthAutoRunStopper = undefined;

		resetCiphertext();
	}
</script>

<p>
	For example, its possible to find out the padding length of a block, by testing at which byte the
	padding error happens. If a change results in invalid padding, you have found the start of the
	padding.
</p>

<p>Try it out yourself! or use the interactive example below:</p>

{#snippet auto()}
	<div class="not-prose mb-4">
		<p>
			Valid padding:

			{#if paddingValidation?.valid}
				<span class="text-success">Yes</span>
			{:else}
				<span class="text-error">No</span>
			{/if}
		</p>
		{#if runningIndex != null}
			<p>
				Possible Padding length (block_size - i) = ({blockSize} - {runningIndex}) = {blockSize -
					runningIndex}
			</p>

			{#if !paddingValidation?.valid}
				<span class="font-bold text-success">Found padding length: {blockSize - runningIndex}</span>
			{/if}
		{/if}
	</div>

	<div class="flex w-full justify-center gap-1">
		{#if runningIndex == null}
			<button type="button" class="button-default input-layer-2" onclick={recoverPaddingLength}>
				Find padding length
			</button>
		{:else}
			<button type="button" class="button-default input-layer-2" onclick={reset}> Reset </button>

			<button
				disabled={runningIndex >= blockSize || !paddingValidation?.valid}
				type="button"
				class="button-default input-layer-2"
				onclick={() => {
					if (runningIndex != null) {
						paddingLengthGate.step();
						runningIndex++;
					}
				}}
			>
				Check next byte
			</button>

			<button
				disabled={runningIndex >= blockSize || !paddingValidation?.valid}
				type="button"
				class="button-default input-layer-2"
				onclick={() => {
					paddingLengthAutoRunStopper = autoRunGate(paddingLengthGate, () => 750);
				}}
			>
				Auto run
			</button>
		{/if}
	</div>
{/snippet}

<ExplainWrapper
	title="Interactive Example - Finding Padding Length"
	wrapperClass="mt-4"
	slides={[auto]}
></ExplainWrapper>
