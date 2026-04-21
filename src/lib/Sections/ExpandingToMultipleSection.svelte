<script lang="ts">
	import Block from '$lib/components/shared/Block.svelte';
	import CBCBlock from '$lib/components/CBC/CBCBlock.svelte';
	import Divider from '$lib/components/shared/Divider.svelte';
	import { cbcEncrypt, cbcDecrypt } from '$lib/logic/cbc';
	import { oneTimePad, stringToArray } from '$lib/logic/crypto-utils';
	import { PKCS7Padder } from '$lib/logic/padding';
	import { type PaddingOracle } from '$lib/logic/paddingOracle';
	import Question from '$lib/components/shared/Question.svelte';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { BLOCK_COLORS, cn } from '$lib/utils/styling';
	import Equal from '@lucide/svelte/icons/equal';

	import ByteRecoverer from '$lib/components/CBCInteractions/ByteRecoverer.svelte';
	import ExplainWrapper from '$lib/components/shared/ExplainWrapper.svelte';

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

	const numBlocks = $derived(ciphertextBlocks.length);

	let guessedOutputBlocks: (number | undefined)[][] = $state(
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
	);

	let guessedPlaintextBlocks: (number | undefined)[][] = $state(
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
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

<StorySection title="Exploiting - Recovering Bytes" headingLevel={3}>
	{#snippet children()}
		<!-- <h3>Exploitation - Recovering Bytes</h3> -->
		<ol class="mb-0! list-disc">
			<li>How do we now recover more than just a single byte?</li>

			<li>
				How can we use the padding oracle to recover information about the second to last byte?
			</li>
		</ol>

		<p>
			For the last byte, we simply "bruteforced" the
			<span class={`text-${BLOCK_COLORS.ciphertext} font-bold`}>last iv byte</span> until the padding
			was valid, which then revealed that the last byte of the decrypted plaintext was 0x01.
		</p>

		<Question id="second-to-last-byte">
			{#snippet question()}
				<ol class="my-0! list-disc">
					<li>How can we apply this to the second to last byte?</li>

					<li>
						What conditions must be met, so a valid padding is obtained and information about the
						second to
						<span class={`text-${BLOCK_COLORS.plaintext}`}>
							last byte of the decrypted plaintext
						</span>
						is gained?
					</li>
				</ol>
			{/snippet}

			{#snippet reveal()}
				<p>
					Just similarly bruteforcing the second to last iv byte until we get valid padding won't
					work, because not only the
					<span class={`text-${BLOCK_COLORS.plaintext}`}>penultimate plaintext byte</span>
					has to be valid padding but also all the following bytes.
				</p>

				<p>
					So we also need to ensure that the
					<span class={`text-${BLOCK_COLORS.plaintext}`}>
						<span class="font-bold">last</span> plaintext byte
					</span>
					is 0x02, before we bruteforce the
					<span class={`text-${BLOCK_COLORS.ciphertext}`}> second to last iv byte </span>
					. How? By modifying the
					<span class={`text-${BLOCK_COLORS.ciphertext}`}>
						<span class="font-bold">last</span> iv byte
					</span>
					to make the
					<span class={`text-${BLOCK_COLORS.plaintext}`}>
						<span class="font-bold">last</span> plaintext byte
					</span>
					0x02. Then we can bruteforce the
					<span class={`text-${BLOCK_COLORS.ciphertext}`}>
						<span class="font-bold">second to last</span> iv byte
					</span>
					until we get valid padding, which will then mean that the second to last and last

					<span class={`text-${BLOCK_COLORS.plaintext}`}> plaintext </span>

					byte is 0x02.
				</p>
			{/snippet}
		</Question>

		<p>
			How to set the last plaintext byte to 0x02? Remember, we just recovered
			<span class="text-red-500">DEC[-1]</span>, so we can calculate the required
			<span class={`text-${BLOCK_COLORS.ciphertext}`}>iv</span> byte value to get a
			<span class={`text-${BLOCK_COLORS.plaintext}`}>plaintext</span>
			byte of 0x02, by transforming this cbc equation:
		</p>

		<p class="text-center">
			<span class="text-blue-400">P[-1]</span> = <span class="text-green-400">IV[-1]</span>
			XOR
			<span class="text-red-500">DEC[-1]</span>
		</p>

		<p class="flex-center"><Equal /></p>

		<p class="text-center">
			<span class="text-green-400">IV[-1]</span> =
			<span class="text-blue-400">0x02</span>
			XOR
			<span class="text-red-500">DEC[-1]</span>
		</p>

	

		<ExplainWrapper>
			<div class="not-prose">
				<ByteRecoverer
					{ciphertextBlocks}
					{guessedOutputBlocks}
					{paddingOracle}
					{guessedPlaintextBlocks}
					{resetCiphertext}
					showEdgeCheckSwitch={false}
					multipleBytes={true}
				/>
			</div>
		</ExplainWrapper>
	{/snippet}

	{#snippet visualSnippet()}
		<h2 class="mb-10 text-center text-2xl font-bold">Recovering Multiple Bytes</h2>
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
