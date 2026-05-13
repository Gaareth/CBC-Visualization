<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import {
		type AttackEvent,
		type ByteRecoveredResult
	} from '$lib/logic/paddingOracle/attackEvents';
	import {
		ATTACKABLE_PADDING_SCHEMES,
		recoverPlaintextWithOracle,
		type SupportedAttackablePaddingSchemes
	} from '$lib/logic/paddingOracle/paddingOracleAttack';
	import { cn } from '$lib/utils';

	import { settingsState, type PaddingScheme } from '../../stores/settings.svelte';
	import { displayByte } from '../../utils/compute';
	import { createGate, autoRunGate, autoGate } from '../../utils/generic';
	import { BLOCK_COLORS } from '../../utils/styling';
	import Block from '../shared/Block.svelte';
	import Card from '../shared/Card.svelte';
	import AutoRunButton, { AUTO_RUN_DELAY_DEFAULT } from './AutoRunButton.svelte';

	interface Props {
		plaintextBlocks: Uint8Array[];
		ciphertextBlocks: Uint8Array[];
		guessedOutputBlocks: (number | undefined)[][];
		guessedPlaintextBlocks: (number | undefined)[][];
		paddingOracle: (cBlocks: Uint8Array[]) => boolean;
		paddingScheme: PaddingScheme;

		resetCiphertext: () => void;
		skipEdgeCheck?: boolean;
		showEdgeCheckSwitch?: boolean;
		multipleBytes?: boolean;
		autoRunAllowed?: boolean;
	}

	let {
		plaintextBlocks,
		ciphertextBlocks = $bindable(),
		guessedOutputBlocks = $bindable(),
		guessedPlaintextBlocks = $bindable(),
		paddingOracle,
		paddingScheme,
		resetCiphertext,
		skipEdgeCheck = false,
		showEdgeCheckSwitch = false,

		multipleBytes = false,
		autoRunAllowed = true
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let originalPlaintext: Uint8Array[] | undefined = $state();

	let checkEdgeCases = $derived(!skipEdgeCheck);
	let guessProgress = $state(0);
	let isGuessing = $state(false);

	let attackProgress: 'idle' | 'running' | 'done' = $state('idle');
	let showResults = $state(false);

	let bytesRecovered = $state(0);
	let currentByteIndex = $state(1);
	let currentBlockIndex = $state(null as number | null);

	let blockGate = createGate();
	let byteGate = createGate();
	let interactionGate = createGate();

	let autoRunIsEnabled = $state(false);

	let attackState: AttackEvent | undefined = $state();

	let stopAutoGuess: () => void = $state(() => () => {});

	let byteRecoveredResult: ByteRecoveredResult['data'] | undefined = $state();

	let guessSpeedSettings = $state({
		type: 'exponential' as 'exponential' | 'constant',
		constantDelayValue: 500,
		exponentialDelayDenominator: 6
	});

	let autoRunDelay = $state(AUTO_RUN_DELAY_DEFAULT);

	async function findValidPadding() {
		showResults = false;
		guessProgress = 0;
		originalPlaintext = plaintextBlocks;
		attackProgress = 'running';

		const easeOut = (i: number) => {
			if (i <= 2) return guessSpeedSettings.constantDelayValue;

			const start = guessSpeedSettings.constantDelayValue;
			const end = 10;
			const t = 1 - Math.exp(-i / guessSpeedSettings.exponentialDelayDenominator);
			return end + (start - end) * (1 - t);
		};
		const delayFunction = (i: number) => {
			if (guessSpeedSettings.constantDelayValue == 0) {
				// @ts-ignore
				guessGate = autoGate;
				return 0;
			}

			if (guessSpeedSettings.type === 'constant') {
				return guessSpeedSettings.constantDelayValue;
			} else {
				return easeOut(i);
			}
		};

		if (stopAutoGuess) {
			stopAutoGuess();
		}

		let guessGate = createGate();
		stopAutoGuess = autoRunGate(guessGate, delayFunction);
		
		const attackablePaddingScheme: SupportedAttackablePaddingSchemes =
			ATTACKABLE_PADDING_SCHEMES.includes(paddingScheme as any)
				? (paddingScheme as SupportedAttackablePaddingSchemes)
				: 'PKCS#5/7';
		await recoverPlaintextWithOracle(ciphertextBlocks, paddingOracle, attackablePaddingScheme, {
			blockGate,
			byteGate,
			guessGate,
			interactionGate,
			outGuessedDecBlocks: guessedOutputBlocks,
			outGuessedPlaintextBlocks: guessedPlaintextBlocks,

			progress: {
				onByteStart: (i) => {
					attackState = { event: 'on-byte-start' };
					currentByteIndex = i;
				},

				onBlockEnd: (i) => {
					attackState = { event: 'on-block-end', data: { blockIndex: i } };
				},

				onBlockStart: (i) => {
					currentBlockIndex = i;
				},

				onByteEnd: (byteIndex) => {
					bytesRecovered = byteIndex;
					attackState = { event: 'on-byte-end' };
					guessProgress = 1;
				},

				onGuess: (guess) => {
					guessProgress = guess / 255;
					isGuessing = true;
				},

				onCiphertextChange: () => {
					ciphertextBlocks = [...ciphertextBlocks];
				},

				onOutputChange: () => {
					guessedPlaintextBlocks = [...guessedPlaintextBlocks];
					guessedOutputBlocks = [...guessedOutputBlocks];
				},

				onProgressUpdate: (event) => {
					attackState = event;

					if (event.event == 'edge-case-check') {
						isGuessing = false;
					}

					if (event.event == 'on-byte-recovered') {
						isGuessing = false;
						guessProgress = 1;
					}

					if (event.event == 'byte-recovered-result') {
						showResults = true;
						byteRecoveredResult = event.data;
					}
				}
			},

			skipEdgeCaseCheck: !checkEdgeCases
		});

		stopAutoGuess();
		attackProgress = 'done';
		showResults = true;
	}

	async function next() {
		if (attackState?.event == 'on-block-end') {
			blockGate.step();
		} else if (attackState?.event == 'on-byte-end') {
			byteGate.step();
		} else {
			interactionGate.step();
		}
	}

	async function reset() {
		stopAutoGuess?.();

		isGuessing = false;
		showResults = false;
		guessProgress = 0;
		currentByteIndex = 1;
		bytesRecovered = 0;
		attackState = undefined;
		attackProgress = 'idle';
		// guessedOutputBlock.fill(undefined);
		// guessedPlaintextBlock.fill(undefined);

		guessedOutputBlocks.forEach((block) => block.fill(undefined));
		guessedPlaintextBlocks.forEach((block) => block.fill(undefined));

		resetCiphertext();
	}

	function displayByteWrapper(byte: number | undefined) {
		return displayByte(byte, settingsState.displayBytesAs, true);
	}

	let inputClassNames: Record<number, string> = $state({});

	let blockSize = $derived(ciphertextBlocks[0].length);
	$effect(() => {
		// inputClassNames = {};
		// inputClassNames[blockSize - currentByteIndex - 1] = `border-r-${BLOCK_COLORS.plaintext}!`;
		// inputClassNames[blockSize - currentByteIndex] = `border-${BLOCK_COLORS.plaintext}!`;

		inputClassNames = {
			[blockSize - currentByteIndex - 1]: `border-r-${BLOCK_COLORS.plaintext}!`,
			[blockSize - currentByteIndex]: `border-${BLOCK_COLORS.plaintext}!`
		};
	});

	function getMismatchErrorForBlock(index: number) {
		if (originalPlaintext == undefined) {
			return;
		}

		let indices: number[] = [];
		for (let i = 0; i < guessedPlaintextBlocks[index].length; i++) {
			const guessedByte = guessedPlaintextBlocks[index][i];
			const originalByte = originalPlaintext[index][i];

			if (guessedByte != null && guessedByte !== originalByte) {
				indices.push(i);
			}
		}

		if (indices.length === 0) {
			return undefined;
		}

		const expectedString = indices
			.map((i) =>
				displayByte(
					originalPlaintext && originalPlaintext[index]?.[i] !== undefined
						? originalPlaintext[index]?.[i]
						: undefined,
					settingsState.displayBytesAs
				)
			)
			.join(', ');

		return {
			message: 'Mismatch at bytes: ' + indices.join(', ') + ' Expected: ' + expectedString,
			indices
		};
	}
</script>

{#snippet InfoContent()}
	{#if attackState?.event == 'edge-case-check'}
		<p class="text-center">Modify the next byte to verify 0x01 was found</p>
	{:else if attackState?.event == 'edge-case-check-result'}
		<p class={cn('text-center', attackState.data.paddingValid ? 'text-green-500' : 'text-red-500')}>
			{attackState.data.paddingValid
				? 'Padding valid! 0x01 found.'
				: 'Invalid padding! Last byte cannot be 0x01, continuing bruteforce...'}
		</p>
	{:else if attackState?.event == 'on-byte-recovered'}
		<p class="text-center">
			<span class="text-red-500">DEC[-{currentByteIndex}]</span> =
			<span class="text-blue-400"> {displayByteWrapper(currentByteIndex)} </span>
			XOR
			<span class="text-green-400">modifiedIV[-{currentByteIndex}]</span>
		</p>

		<p class="text-center">
			<span class="text-blue-400">P[-{currentByteIndex}]</span> =
			<span class="text-green-400">originalIV[-{currentByteIndex}]</span>
			XOR
			<span class="text-red-500">DEC[-{currentByteIndex}]</span>
		</p>
	{:else if (attackState?.event == 'byte-recovered-result' || attackState?.event == 'on-byte-end') && byteRecoveredResult}
		<p class="text-center">
			<span class="text-red-500">{displayByteWrapper(byteRecoveredResult.decByte)}</span> =
			<span class="text-blue-400"> {displayByteWrapper(currentByteIndex)} </span>
			XOR
			<span class="text-green-400">{displayByteWrapper(byteRecoveredResult.guess)}</span>
		</p>

		<p class="text-center">
			<span class="text-blue-400">{displayByteWrapper(byteRecoveredResult.guessedByte)}</span> =
			<span class="text-green-400">{displayByteWrapper(byteRecoveredResult.originalIVByte)}</span>
			XOR
			<span class="text-red-500">{displayByteWrapper(byteRecoveredResult.decByte)}</span>
		</p>
	{:else if attackState?.event == 'on-byte-start' && currentByteIndex > 1}
		<p>For i in 1..={currentByteIndex - 1}:</p>
		<p class="text-center">
			<span class="text-green-400">IV[-i]</span> =
			<span class="text-blue-400">{displayByteWrapper(currentByteIndex)}</span>
			XOR
			<span class="text-red-500">DEC[-i]</span>
		</p>
	{:else if isGuessing}
		<p class="animate-pulse text-center">Bruteforcing IV til valid padding</p>
	{/if}
{/snippet}

{#snippet ActionButton()}
	<button
		type="button"
		class="flex-1 button-default input-layer-2"
		onclick={() => {
			if (
				(attackState?.event == 'on-byte-end' && !multipleBytes) ||
				(attackState?.event == 'on-block-end' && attackState.data.blockIndex == 1)
			) {
				reset();
			}

			if (attackProgress == 'idle') {
				findValidPadding();
			}

			next();
		}}
		disabled={isGuessing}
	>
		{#if attackProgress == 'idle' || (attackState?.event == 'on-byte-start' && currentByteIndex == 1)}
			Automatically find valid padding
		{:else if attackState?.event == 'edge-case-check'}
			Check edge case
		{:else if attackState?.event == 'edge-case-check-result'}
			Continue {!attackState?.data.paddingValid ? 'searching' : ''}
		{:else if attackState?.event == 'on-byte-recovered'}
			Recover DEC[-{currentByteIndex}]
		{:else if attackState?.event == 'on-byte-start' && currentByteIndex > 1}
			Set last {currentByteIndex - 1} bytes to {displayByteWrapper(currentByteIndex)}
		{:else if attackState?.event == 'after-set-padding-bytes'}
			Start bruteforce of P{currentBlockIndex! - 1}[-{currentByteIndex}]
		{:else if attackState?.event == 'on-byte-end' && multipleBytes}
			Next byte
		{:else if attackState?.event == 'on-block-end' && multipleBytes && attackState.data.blockIndex != 1}
			Next block
		{:else}
			Restart
		{/if}
	</button>
{/snippet}

<div class="flex flex-col gap-3">
	{#if !ATTACKABLE_PADDING_SCHEMES.includes(paddingScheme as any)}
		<div class="border border-warning p-1.5">
			{#if paddingScheme == 'ANSI X9.23 (random)'}
				<p>
					The padding validator only validates the last byte and not the random padding, so the
					oracle would only reveal the possible valid values for the last byte (0x01 - blockSize).
				</p>
			{/if}

			<p>
				The recovery algorithm based on PKCS#7 padding is used instead. You can observe where it
				fails.
			</p>
		</div>
	{/if}

	{#if showEdgeCheckSwitch}
		<label class="flex justify-between">
			Check for edge cases
			<div class="flex-center flex-1">
				<Switch bind:checked={checkEdgeCases} />
			</div>
		</label>
	{/if}

	{#if !autoRunIsEnabled || autoRunDelay >= 5000}
		{@render InfoContent()}
	{/if}

	<!-- {guessedOutputBlocks} -->
	<div class="flex flex-wrap gap-1">
		<button
			type="button"
			class={cn(attackProgress == 'done' && 'flex-1', 'button-default input-layer-2')}
			onclick={reset}
		>
			Reset
		</button>

		{@render ActionButton()}

		<AutoRunButton
			surfaceLevel={2}
			{blockGate}
			{byteGate}
			{interactionGate}
			bind:isEnabled={autoRunIsEnabled}
			bind:guessSpeedSettings
			bind:autoRunDelay
			isToggleable={autoRunAllowed}
		/>
	</div>

	<div>
		<p>
			Guess progress: {guessProgress * 255} / 255
			{#if multipleBytes && currentByteIndex > 1}
				| Total progres: {bytesRecovered} / {ciphertextBlocks[0].length}
			{/if}
		</p>
		<progress class="w-full surface-outline-2" value={guessProgress} max={1}> </progress>
		{#if multipleBytes && currentByteIndex > 1}
			<progress
				class="w-full surface-outline-2"
				value={bytesRecovered / ciphertextBlocks[0].length}
				max={1}
			>
			</progress>
		{/if}

		{#if showResults}
			{@render ResultPanel()}
		{/if}
	</div>
</div>

{#if skipEdgeCheck}
	<div class="text-xs text-warning">
		Disclaimer: This does not check edge cases. See next interactive example for that.
	</div>
{/if}

{#snippet ResultPanel()}
	{#if !multipleBytes}
		<p class="lockin-animation font-bold">
			Recovered plaintext byte: <span class={`text-${BLOCK_COLORS.plaintext} font-bold`}>
				{displayByteWrapper(guessedPlaintextBlocks[1][guessedPlaintextBlocks[1].length - 1])}
			</span>
		</p>

		{#if originalPlaintext && originalPlaintext[0][originalPlaintext[0].length - 1] !== guessedPlaintextBlocks[1][guessedPlaintextBlocks[1].length - 1]}
			<p class="text-error">
				Expected: {displayByteWrapper(
					originalPlaintext[originalPlaintext.length - 1][originalPlaintext[0].length - 1]
				)}
			</p>
		{/if}
	{:else}
		<div class="mx-auto w-fit">
			<p>Recovered Plaintext:</p>
			<div class={cn('flex gap-1', { 'lockin-animation': showResults })}>
				{#each { length: guessedPlaintextBlocks.length - 1 } as _, index (index)}
					<Block
						bytes={guessedPlaintextBlocks[index + 1]}
						success={showResults}
						error={getMismatchErrorForBlock(index)}
						reserveSpaceForError={true}
						surfaceLevel={2}
						inputClassNames={currentBlockIndex && index === currentBlockIndex - 1
							? inputClassNames
							: {}}
					/>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}
