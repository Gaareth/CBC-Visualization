<script lang="ts">
	import { uint8ArrayToUI, wrapOnChange } from '$lib/utils/arrayConversion';
	import { BLOCK_COLORS } from '$lib/utils/styling';
	import Block from '../../shared/Block.svelte';
	import CBCBlock from '../CBCBlock.svelte';
	import { type PaddingValidationResult } from '$lib/logic/padding/padding';

	interface Props {
		plaintextBlock: Uint8Array;
		ciphertextBlock: Uint8Array;
		initializationVector: Uint8Array;
		guessedOutputBlock: (number | undefined)[];

		paddingValidation: PaddingValidationResult;
		showSuccess?: boolean;

		onChangeCiphertext?: (bytes: Uint8Array) => void;
		onChangeIV?: (bytes: Uint8Array) => void;
	}

	let {
		plaintextBlock,
		ciphertextBlock = $bindable(),
		initializationVector,
		guessedOutputBlock,
		paddingValidation,
		showSuccess,

		onChangeCiphertext,
		onChangeIV
	}: Props = $props();

	const blockSize = $derived(plaintextBlock.length);

	function makeBorderMap(color: string) {
		return {
			[blockSize - 2]: `border-r-${color}!`,
			[blockSize - 1]: `border-${color}!`
		} satisfies Record<number, string>;
	}

	let inputClassNamesPL = $derived(makeBorderMap(BLOCK_COLORS.plaintext));
	let inputClassNamesIV = $derived(makeBorderMap(BLOCK_COLORS.ciphertext));
	let inputClassNamesFN = $derived(makeBorderMap(BLOCK_COLORS.fnOutput));

	function extractPaddingError(result: PaddingValidationResult) {
		if (result.valid) {
			return undefined;
		}
		return {
			message: result.message ?? 'Invalid padding',
			indices: result.invalidIndices ?? []
		};
	}
</script>

<CBCBlock
	addInitPadding={true}
	encryptionMode={false}
	index={0}
	{plaintextBlock}
	{ciphertextBlock}
	{initializationVector}
	isLastBlock={true}
	{onChangeCiphertext}
>
	{#snippet FnOutputBlock(index)}
		<Block bytes={guessedOutputBlock} inputClassNames={inputClassNamesFN} />
	{/snippet}

	{#snippet IVBlock(index)}
		<Block
			bytes={uint8ArrayToUI(initializationVector)}
			onChange={wrapOnChange(onChangeIV)}
			allowEdit={true}
			reserveSpaceForError={true}
			title="Initialization Vector (IV)"
			classNameTextAbove="absolute -top-7 w-full"
			inputClassNames={inputClassNamesIV}
		/>
	{/snippet}

	{#snippet PlainTextBlock(index)}
		<Block
			bytes={uint8ArrayToUI(plaintextBlock)}
			error={extractPaddingError(paddingValidation)}
			success={showSuccess}
			reserveSpaceForError={true}
			title={`Plaintext Block ${index} (P_${index})`}
			textPosBelow={true}
			inputClassNames={inputClassNamesPL}
			className="flex-center"
		/>
	{/snippet}
</CBCBlock>
