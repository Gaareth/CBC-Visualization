<script lang="ts">
	import { stringToArray } from '../../logic/crypto-utils';
	import Block from '../shared/Block.svelte';
	import { cn } from '../../utils/styling';
	import { type PaddingOracle } from '../../logic/paddingOracle';
	import CBCBlock from './CBCBlock.svelte';
	import ExplainWrapper from '../shared/ExplainWrapper.svelte';
	import { CBC_LAYOUT, getGapToNext, getToXorLength } from '$lib/stores/cbcConstants.svelte';
	import ByteRecoverer from '../CBCInteractions/ByteRecoverer.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { uint8ArrayToUI } from '$lib/utils/arrayConversion';
	import { encryptCBCWithContext, decryptCBCWithContext } from '$lib/logic/cbc-service';
	import { settingsState } from '$lib/stores/settings.svelte';

	let initializationVector = $state(new Uint8Array([4, 20, 150, 3, 100, 41, 42, 201]));

	let plaintext = $state('A SECRET MESSAGE');
	let plaintextBlock = $derived(stringToArray(plaintext));

	let { plaintextBlocks, ciphertextBlocks, key, padder, paddingScheme } = $derived(
		encryptCBCWithContext(plaintextBlock, initializationVector, settingsState)
	);

	let decryptedplaintextBlocks = $derived(
		decryptCBCWithContext(ciphertextBlocks, key, settingsState)
	);

	let blockSize = $derived(ciphertextBlocks[0].length);
	let numBlocks = $derived(ciphertextBlocks.length);

	let showSuccess = $state(false);
	let attackInProgress = $state(false);
	let currentlyAttackedPlaintextBlock = $state(0);

	// Could be simpler. E.g. take the pkaintext directly.
	// But this is for realism, as in a real attack we would only have the ciphertext and the oracle.

	const paddingOracle: PaddingOracle = (cBlocks) => {
		const decrypted = decryptCBCWithContext(cBlocks, key, settingsState);
		const lastBlock = decrypted[decrypted.length - 1];

		const result = padder.validatePadding(lastBlock);
		paddingValidationResult = result;

		return result.valid;
	};
	let lastBlockPaddingValidationResult = $derived(
		padder.validatePadding(decryptedplaintextBlocks[decryptedplaintextBlocks.length - 1])
	);

	let paddingValidationResult: ReturnType<typeof padder.validatePadding> | undefined =
		$state(undefined);

	function extractPaddingError(result: ReturnType<typeof padder.validatePadding>) {
		if (result.valid) {
			return undefined;
		}
		return {
			message: result.message ?? 'Invalid padding',
			indices: result.invalidIndices ?? []
		};
	}

	function getPaddingErrorForBlock(index: number) {
		if (index === decryptedplaintextBlocks.length - 1) {
			return extractPaddingError(lastBlockPaddingValidationResult);
		} else if (
			attackInProgress &&
			currentlyAttackedPlaintextBlock === index &&
			paddingValidationResult
		) {
			return extractPaddingError(paddingValidationResult);
		} else {
			return undefined;
		}
	}

	let guessedOutputBlocks: number[][] = $derived(
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
	);

	let guessedPlaintextBlocks: number[][] = $derived(
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
	);

	function resetCiphertext() {
		ciphertextBlocks = encryptCBCWithContext(
			plaintextBlock,
			initializationVector,
			settingsState
		).ciphertextBlocks;

		guessedOutputBlocks = Array.from({ length: numBlocks }, () =>
			new Array(blockSize).fill(undefined)
		);
		guessedPlaintextBlocks = Array.from({ length: numBlocks }, () =>
			new Array(blockSize).fill(undefined)
		);
	}

	// neccessary to trigger reactivity when changing a byte in the iv, dont get completely why tho
	let firstCipherBlock = $derived(new Uint8Array(ciphertextBlocks[0]));

	let isLastBlock = $derived((i: number) => i === decryptedplaintextBlocks.length - 1);
</script>

<div class="flex flex-col gap-10">
	<ExplainWrapper
		wrapperClass="w-5xl mx-auto"
		title="Padding Oracle Attack on CBC"
		back={async () => await goto(resolve('/padding-oracle-attack/short-explain'))}
	>
		<ByteRecoverer
			{plaintextBlocks}
			bind:ciphertextBlocks
			bind:guessedOutputBlocks
			bind:guessedPlaintextBlocks
			{paddingOracle}
			{paddingScheme}
			{resetCiphertext}
			showEdgeCheckSwitch={false}
			multipleBytes={true}
		/>
	</ExplainWrapper>

	<div class={cn('flex justify-center')} style={`gap: ${getGapToNext()}px;`}>
		{#each { length: decryptedplaintextBlocks.length } as _, i (i)}
			<CBCBlock
				encryptionMode={false}
				index={i}
				plaintextBlock={decryptedplaintextBlocks[i]}
				ciphertextBlock={ciphertextBlocks[i + 1]}
				initializationVector={i === 0 ? firstCipherBlock : undefined}
				isLastBlock={isLastBlock(i)}
				onChangeCiphertext={(bytes) => {
					ciphertextBlocks[i + 1] = bytes;
					ciphertextBlocks = [...ciphertextBlocks];
				}}
				onChangeIV={(bytes) => {
					ciphertextBlocks[0] = bytes;
					ciphertextBlocks = [...ciphertextBlocks];
				}}
			>
				{#snippet PlainTextBlock(index)}
					<Block
						bytes={uint8ArrayToUI(decryptedplaintextBlocks[index])}
						error={getPaddingErrorForBlock(index)}
						success={showSuccess}
						reserveSpaceForError={true}
						title={`Plaintext Block ${index} (P_${index})`}
						textPosBelow={true}
					/>
				{/snippet}

				{#snippet FnOutputBlock(index)}
					<Block bytes={guessedOutputBlocks[index + 1]} />
				{/snippet}

				{#snippet VerticalBar()}
					<div
						class="absolute bottom-0 bg-dark dark:bg-light"
						style={`height: ${getToXorLength() + CBC_LAYOUT.arrowWidth + CBC_LAYOUT.gap + 32 + CBC_LAYOUT.gap}px;`}
						style:width={`${CBC_LAYOUT.arrowThickness}px;`}
						style:right={`-${CBC_LAYOUT.arrowThickness / 2}px`}
					></div>
				{/snippet}
			</CBCBlock>
		{/each}
	</div>
</div>
