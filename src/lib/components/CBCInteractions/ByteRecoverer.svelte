<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { recoverSingleByte } from '../../logic/paddingOracle';
	import { settingsState } from '../../stores/settings.svelte';
	import { displayByte } from '../../utils/compute';
	import { createGate, autoRunGate } from '../../utils/generic';
	import { BLOCK_COLORS } from '../../utils/styling';

	interface Props {
		plaintextBlocks?: number[][];
		ciphertextBlocks: number[][];
		guessedOutputBlock: number[];
		guessedPlaintextBlock: number[];
		paddingOracle: (cBlocks: number[][]) => boolean;

		resetCiphertext: () => void;
		skipEdgeCheck?: boolean;
	}

	let {
		plaintextBlocks,
		ciphertextBlocks,
		guessedOutputBlock,
		guessedPlaintextBlock,
		paddingOracle,
		resetCiphertext,
		skipEdgeCheck = false
	}: Props = $props();

	let checkEdgeCases = $derived(!skipEdgeCheck);
	let attackProgress = $state(0);
	let showSuccess = $state(false);

	async function findValidPadding() {
		showSuccess = false;
		attackProgress = 0;

		const easeOut = (i: number) => {
			const start = 700;
			const end = 10;
			const t = 1 - Math.exp(-i / 6);
			return end + (start - end) * (1 - t);
		};

		let guessGate = createGate();
		const stopAutoGuess = autoRunGate(guessGate, easeOut);

		await recoverSingleByte(1, ciphertextBlocks[0], ciphertextBlocks[1], paddingOracle, {
			guessGate,
			outGuessedDecBlock: guessedOutputBlock,
			outGuessedPlaintextBlock: guessedPlaintextBlock,

			progress: {
				onGuess: (guess) => {
					attackProgress = guess / 255;
				}
			},

			skipEdgeCaseCheck: !checkEdgeCases
		});

		stopAutoGuess();
		showSuccess = true;
		attackProgress = 1;
	}
</script>

<div class="flex flex-col gap-3">
	{#if !skipEdgeCheck}
		<label class="flex justify-between">
			Check for edge cases
			<div class="flex-center flex-1">
				<Switch bind:checked={checkEdgeCases} />
			</div>
		</label>
	{/if}

	<div class="flex flex-wrap gap-1">
		<button type="button" class="button-default input-layer-2" onclick={resetCiphertext}>
			Reset
		</button>

		<button
			type="button"
			class="flex-1 button-default input-layer-2"
			onclick={findValidPadding}
		>
			Automatically find valid padding
		</button>
	</div>

	<div>
		<p>Progress: {attackProgress * 255} / 255</p>

		<progress class="w-full input-layer-2" value={attackProgress} max={1}> </progress>

		{#if showSuccess}
			<p class="lockin-animation font-bold">
				Recovered plaintext byte: <span class={`text-${BLOCK_COLORS.plaintext} font-bold`}>
					{displayByte(
						guessedPlaintextBlock[guessedPlaintextBlock.length - 1],
						settingsState.displayBytesAs,
						true
					)}
				</span>
			</p>

			{#if plaintextBlocks}
				<p class="text-error">
					Expected: {displayByte(
						plaintextBlocks[plaintextBlocks.length - 1][plaintextBlocks[0].length - 1],
						settingsState.displayBytesAs,
						true
					)}
				</p>
			{/if}
		{/if}
	</div>
</div>
{#if skipEdgeCheck}
	<div class="text-xs text-warning">
		Disclaimer: This does not check edge cases. See next interactive example for that.
	</div>
{/if}
