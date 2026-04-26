<script lang="ts">
	import Block from '$lib/components/shared/Block.svelte';
	import Card from '$lib/components/shared/Card.svelte';
	import CBCBlock from '$lib/components/CBC/CBCBlock.svelte';
	import Divider from '$lib/components/shared/Divider.svelte';
	import ExplainWrapper from '$lib/components/shared/ExplainWrapper.svelte';
	import { cbcEncrypt, cbcDecrypt } from '$lib/logic/cbc';
	import { oneTimePad, stringToArray } from '$lib/logic/crypto-utils';
	import { PKCS7Padder } from '$lib/logic/padding';
	import { type PaddingOracle } from '$lib/logic/paddingOracle';
	import Question from '$lib/components/shared/Question.svelte';
	import { settingsState } from '$lib/stores/settings.svelte';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { displayByte } from '$lib/utils/compute';
	import { BLOCK_COLORS, cn } from '$lib/utils/styling';

	import ByteRecoverer from '$lib/components/CBCInteractions/ByteRecoverer.svelte';

	let showSuccess = $state(false);

	let padder = new PKCS7Padder();
	let plaintext = $state('FORCE');
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector = [0x10, 0xf0, 0xf0, 0x42, 0x00, 0xfe, 0xb0, 0xff];

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
		ciphertextBlocks = cbcEncrypt(
			plaintextBlock,
			key,
			initializationVector,
			oneTimePad,
			padder
		).ciphertextBlocks;
	}

	const inputClassNamesPL: Record<number, string> = {};
	inputClassNamesPL[blockSize - 2] = `border-r-${BLOCK_COLORS.plaintext}!`;
	inputClassNamesPL[blockSize - 1] = `border-${BLOCK_COLORS.plaintext}!`;

	const inputClassNamesIV: Record<number, string> = {};
	inputClassNamesIV[blockSize - 2] = `border-r-${BLOCK_COLORS.ciphertext}!`;
	inputClassNamesIV[blockSize - 1] = `border-${BLOCK_COLORS.ciphertext}!`;

	const inputClassNamesFN: Record<number, string> = {};
	inputClassNamesFN[blockSize - 2] = `border-r-${BLOCK_COLORS.fnOutput}!`;
	inputClassNamesFN[blockSize - 1] = `border-${BLOCK_COLORS.fnOutput}!`;

	let guessedOutputBlocks: (number | undefined)[][] = $state(
		Array.from({ length: 2 }, () => new Array(blockSize).fill(undefined))
	);

	let guessedPlaintextBlocks: (number | undefined)[][] = $state(
		Array.from({ length: 2 }, () => new Array(blockSize).fill(undefined))
	);

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

{#snippet example()}
	<div class="not-prose flex w-full flex-col gap-1">
		<p>Try it out: Modify the IV until you get valid padding</p>

		<Divider
			className="my-4 text-muted-foreground text-base"
			text="or automatically"
			surfaceLevel={1}
		/>

		<ByteRecoverer
			skipEdgeCheck={true}
			showEdgeCheckSwitch={false}
			{ciphertextBlocks}
			{guessedOutputBlocks}
			{paddingOracle}
			{guessedPlaintextBlocks}
			{resetCiphertext}
		/>
	</div>
{/snippet}

<StorySection title="Exploiting - Recovering a single byte" headingLevel={3}>
	{#snippet children()}
		<p>
			Even worse, a padding oracle can be used to gain information about the decrypted plaintext and
			even further to completely recover it
		</p>

		<Card title="Question" className="text-center">Can you think of a way to exploit this?</Card>

		<!-- <p class="text-muted-foreground m-0!">First set the IV to zero</p> -->
		<p>
			You can make predictable changes to the
			<span class={`text-${BLOCK_COLORS.plaintext}`}>last byte of the decrypted plaintext</span>
			by modifying the last <span class={`text-${BLOCK_COLORS.ciphertext}`}>byte of the IV</span>.
			In most cases, this will result in invalid padding. However, if you get valid padding, you can
			deduce information about the
			<span class={`text-${BLOCK_COLORS.plaintext}`}>decrypted plaintext</span>.
		</p>

		<Question id="valid-padding-plaintext">
			{#snippet question()}
				<p class="my-0! text-center">What does this tell you?</p>
			{/snippet}

			{#snippet reveal()}
				<p class="my-0!">
					If you get no padding error, the <span class={`text-${BLOCK_COLORS.plaintext}`}
						>last byte of the decrypted plaintext</span
					>
					is likely (except for a few cases)
					<span class={`text-${BLOCK_COLORS.plaintext} font-bold`}>0x01</span>. You can then try all
					possible byte values (0-255) for the
					<span class={`text-${BLOCK_COLORS.ciphertext}`}>last byte of the IV</span>, to find a
					<span class={`text-${BLOCK_COLORS.plaintext}`}>plaintext</span> with valid padding.
				</p>

				<p class="text-center">
					<span class={`text-${BLOCK_COLORS.plaintext}`}>0x01</span> =
					<span class={`text-${BLOCK_COLORS.ciphertext}`}>IV[-1]</span>
					XOR
					<span class={`text-${BLOCK_COLORS.fnOutput}`}>DEC[-1]</span>
				</p>
			{/snippet}
		</Question>

		<div>
			<p class="mb-0!">
				With this knowledge, you can then first calculate the <span
					class={`text-${BLOCK_COLORS.fnOutput}`}
					>last byte of the output of the block cipher decryption function</span
				>
				(DEC):
			</p>

			<p class="text-center">
				<span class="text-red-500">DEC[-1]</span> = <span class="text-blue-400">0x01</span>
				XOR
				<span class="text-green-400">IV[-1]</span>
			</p>

			<p class="text-center">
				<span class="text-red-500"
					>{displayByte(
						guessedOutputBlocks[1][guessedOutputBlocks[1].length - 1],
						settingsState.displayBytesAs,
						true
					)}</span
				>
				= <span class="text-blue-400">0x01</span>
				XOR
				<span class="text-green-400"
					>{displayByte(
						ciphertextBlocks[0][ciphertextBlocks[0].length - 1],
						settingsState.displayBytesAs,
						true
					)}</span
				>
			</p>
		</div>

		<div class="my-10">
			<p class="mb-0!">
				and then the
				<span class={`text-${BLOCK_COLORS.plaintext}`}>last byte of the original plaintext</span>
				by xoring with the
				<span class={`text-${BLOCK_COLORS.ciphertext}`}>
					last byte of the <span class="font-bold">original</span> IV
				</span>:
			</p>

			<p class="text-center">
				<span class="text-blue-400">P[-1]</span> = <span class="text-green-400">IV[-1]</span>
				XOR
				<span class="text-red-500">DEC[-1]</span>
			</p>

			<p class="text-center">
				<span class="text-blue-400">
					{displayByte(
						guessedPlaintextBlocks[1][guessedPlaintextBlocks[1].length - 1],
						settingsState.displayBytesAs,
						true
					)}
				</span>
				=
				<span class="text-green-400">
					{displayByte(
						initializationVector[initializationVector.length - 1],
						settingsState.displayBytesAs,
						true
					)}
				</span>
				XOR
				<span class="text-red-500">
					{displayByte(
						guessedOutputBlocks[1][guessedOutputBlocks[1].length - 1],
						settingsState.displayBytesAs,
						true
					)}
				</span>
			</p>
		</div>

		<ExplainWrapper slides={[example]} title="Interactive Example - Recovering a Byte"
		></ExplainWrapper>

		<p>
			Learn about edge cases and <a
				href="#Exploiting - Recovering Bytes"
				class="no-underline hover:underline">recovering the full plaintext</a
			> in the next sections.
		</p>
	{/snippet}

	{#snippet visualSnippet()}
		<h2 class="mb-10 text-center text-2xl font-bold">Recovering a Single Byte</h2>
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
			>
				{#snippet FnOutputBlock(index)}
					<Block bytes={guessedOutputBlocks[1]} inputClassNames={inputClassNamesFN} />
				{/snippet}

				{#snippet IVBlock(index)}
					<Block
						bytes={ciphertextBlocks[0]}
						onChange={(bytes) => {
							ciphertextBlocks[0] = bytes.map((b) => b ?? 0) as number[];
						}}
						allowEdit={true}
						reserveSpaceForError={true}
						title="Initialization Vector (IV)"
						classNameTextAbove="absolute -top-7 w-full"
						inputClassNames={inputClassNamesIV}
					/>
				{/snippet}

				{#snippet PlainTextBlock(index)}
					<Block
						bytes={plaintextBlocks[index]}
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
		</div>
	{/snippet}
</StorySection>
