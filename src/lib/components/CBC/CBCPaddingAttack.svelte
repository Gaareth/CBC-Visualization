<script lang="ts">
	import { cbcDecrypt, cbcEncrypt } from '$lib/logic/cbc';
	import { oneTimePad, stringToArray } from '../../logic/crypto-utils';
	import { PKCS7Padder } from '../../logic/padding';
	import { autoRunGate, createGate } from '$lib/utils/generic';
	import Block from '../shared/Block.svelte';
	import { cn } from '../../utils/styling';
	import { recoverPlaintextWithOracle, type PaddingOracle } from '../../logic/paddingOracle';
	import CBCBlock from './CBCBlock.svelte';
	import ExplainWrapper from '../shared/ExplainWrapper.svelte';
	import { CBC_LAYOUT, getGapToNext, getToXorLength } from '$lib/stores/cbcConstants.svelte';
	import ByteRecoverer from '../CBCInteractions/ByteRecoverer.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getFixedKey } from '$lib/logic/ciphers/cipherTEA';
	import { uint8ArrayToUI } from '$lib/utils/arrayConversion';

	let key = getFixedKey();
	let initializationVector = $state(new Uint8Array([4, 20, 150, 3, 100, 41, 42, 201]));

	let plaintext = $state('A SECRET MESSAGE');
	let plaintextBlock = $derived(stringToArray(plaintext));

	let padder = new PKCS7Padder();

	let { ciphertextBlocks, plaintextBlocks } = $state(
		cbcEncrypt(plaintextBlock, key, initializationVector, oneTimePad, padder)
	);

	let decryptedplaintextBlocks = $derived(cbcDecrypt(ciphertextBlocks, key, oneTimePad));

	let blockSize = $derived(ciphertextBlocks[0].length);
	let numBlocks = $derived(ciphertextBlocks.length);

	let showSuccess = $state(false);
	let attackInProgress = $state(false);
	let currentlyAttackedPlaintextBlock = $state(0);

	// Could be simpler. E.g. take the pkaintext directly.
	// But this is for realism, as in a real attack we would only have the ciphertext and the oracle.
	const paddingOracle: PaddingOracle = (cBlocks) => {
		const decrypted = cbcDecrypt(cBlocks, key, oneTimePad);
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

	let guessedOutputBlocks: number[][] = $state(
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
	);

	let guessedPlaintextBlocks: number[][] = $state(
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
	);

	function resetCiphertext() {
		ciphertextBlocks = cbcEncrypt(
			plaintextBlock,
			key,
			initializationVector,
			oneTimePad,
			padder
		).ciphertextBlocks;

		guessedOutputBlocks = Array.from({ length: numBlocks }, () =>
			new Array(blockSize).fill(undefined)
		);
		guessedPlaintextBlocks = Array.from({ length: numBlocks }, () =>
			new Array(blockSize).fill(undefined)
		);
	}

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
			{ciphertextBlocks}
			{guessedOutputBlocks}
			{paddingOracle}
			{guessedPlaintextBlocks}
			{resetCiphertext}
			showEdgeCheckSwitch={false}
			multipleBytes={true}
		/>
	</ExplainWrapper>

	<div class={cn('flex justify-center')} style={`gap: ${getGapToNext()}px;`}>
		{#each { length: decryptedplaintextBlocks.length } as _, i}
			<CBCBlock
				encryptionMode={false}
				index={i}
				plaintextBlock={decryptedplaintextBlocks[i]}
				ciphertextBlock={ciphertextBlocks[i + 1]}
				initializationVector={i === 0 ? ciphertextBlocks[0] : undefined}
				isLastBlock={isLastBlock(i)}
				onChangeCiphertext={(bytes) => (ciphertextBlocks[i + 1] = bytes)}
				onChangeIV={(bytes) => {
					ciphertextBlocks[0] = bytes;
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
