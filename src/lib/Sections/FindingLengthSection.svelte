<script lang="ts">
	import Block from '$lib/components/shared/Block.svelte';
	import CBCBlock from '$lib/components/CBC/CBCBlock.svelte';
	import { cbcEncrypt, cbcDecrypt } from '$lib/logic/cbc';
	import { oneTimePad, stringToArray } from '$lib/logic/crypto-utils';
	import { PKCS7Padder } from '$lib/logic/padding';
	import type { PaddingOracle } from '$lib/logic/paddingOracle';
	import PaddingLengthFinder from '$lib/components/CBCInteractions/PaddingLengthFinder.svelte';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { cn } from '$lib/utils/styling';

	let showSuccess = $state(false);

	let padder = new PKCS7Padder();
	let plaintext = 'LENGTH';
	let plaintextBlock = stringToArray(plaintext);
	let initializationVector = $state([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
	let key = [0, 0, 0, 0, 0, 0, 0, 0];

	let { ciphertextBlocks } = $state(
		cbcEncrypt(plaintextBlock, key, initializationVector, oneTimePad, padder)
	);

	let plaintextBlocks = $derived(cbcDecrypt(ciphertextBlocks, key, oneTimePad));

	const blockSize = $derived(ciphertextBlocks[0].length);

	let paddingValidation: ReturnType<typeof padder.validatePadding> = $derived(
		padder.validatePadding(plaintextBlocks[plaintextBlocks.length - 1])
	);

	const paddingOracle: PaddingOracle = (cBlocks) => {
		const decrypted = cbcDecrypt(cBlocks, key, oneTimePad);
		const lastBlock = decrypted[decrypted.length - 1];

		const result = padder.validatePadding(lastBlock);
		paddingValidation = result;

		return result.valid;
	};

	function resetCiphertext() {
		// ciphertextBlocks = cloneBlocks(
		// 	cbcEncrypt(plaintextBlock, key, initializationVector, oneTimePad, padder).ciphertextBlocks
		// );

		ciphertextBlocks = cbcEncrypt(
			plaintextBlock,
			key,
			initializationVector,
			oneTimePad,
			padder
		).ciphertextBlocks;
	}

	function extractPaddingError(result: ReturnType<typeof padder.validatePadding>) {
		if (result.valid) {
			return undefined;
		}
		return {
			message: result.message ?? 'Invalid padding',
			indices: result.invalidIndices ?? []
		};
	}
</script>

<StorySection id="exploiting-finding-padding-length">
	{#snippet children()}
		<h3>Exploiting - Finding the padding length</h3>

		<PaddingLengthFinder
			bind:showSuccess
			{resetCiphertext}
			{ciphertextBlocks}
			{paddingOracle}
			{blockSize}
			{paddingValidation}
		/>
	{/snippet}

	{#snippet visualSnippet()}
		<h2 class="mb-10 text-center text-2xl font-bold">Finding the Padding Length</h2>
		<div class={cn('not-prose flex w-fit justify-end')}>
			<CBCBlock
				addInitPadding={true}
				encryptionMode={false}
				index={0}
				plaintextBlock={plaintextBlocks[0]}
				ciphertextBlock={ciphertextBlocks[1]}
				initializationVector={ciphertextBlocks[0]}
				isLastBlock={true}
				onChangeCiphertext={(bytes) => (ciphertextBlocks[1] = bytes.map((b) => b ?? 0) as number[])}
				onChangeIV={(bytes) => {
					ciphertextBlocks[0] = bytes.map((b) => b ?? 0) as number[];
				}}
			>
				{#snippet PlainTextBlock(index)}
					<Block
						bytes={plaintextBlocks[index]}
						error={extractPaddingError(paddingValidation)}
						success={showSuccess}
						reserveSpaceForError={true}
						title={`Plaintext Block ${index} (P_${index})`}
						textPosBelow={true}
					/>
				{/snippet}
			</CBCBlock>
		</div>
	{/snippet}
</StorySection>
