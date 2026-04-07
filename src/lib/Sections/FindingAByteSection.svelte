<script lang="ts">
	import Block from '$lib/Block.svelte';
	import Card from '$lib/Card.svelte';
	import CBCBlock, { STYLE_CONSTANTS } from '$lib/CBCBlock.svelte';
	import Divider from '$lib/Divider.svelte';
	import ExplainWrapper from '$lib/ExplainWrapper.svelte';
	import { cbcEncrypt, cbcDecrypt } from '$lib/logic/cbc';
	import { oneTimePad, stringToArray } from '$lib/logic/crypto-utils';
	import { PKCS7Padder } from '$lib/logic/padding';
	import {
		recoverPlaintextWithOracle,
		recoverSingleByte,
		type PaddingOracle
	} from '$lib/logic/paddingOracle';
	import PaddingLengthFinder from '$lib/PaddingLengthFinder.svelte';
	import Question from '$lib/Question.svelte';
	import { settingsState } from '$lib/stores/settings.svelte';
	import StorySection from '$lib/StorySection.svelte';
	import { displayByte } from '$lib/utils/compute';
	import { createGate, autoRunGate, autoGate } from '$lib/utils/generic';
	import { cloneBlocks } from '$lib/utils/reactivity.svelte';
	import { cn } from '$lib/utils/styling';
	import Spoiler from '$lib/Spoiler.svelte';

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

	const BLOCK_COLORS = {
		fnOutput: 'red-500',
		ciphertext: 'green-400',
		plaintext: 'blue-400'
	};

	const inputClassNamesPL: Record<number, string> = {};
	inputClassNamesPL[blockSize - 2] = `border-r-${BLOCK_COLORS.plaintext}`;
	inputClassNamesPL[blockSize - 1] = `border-${BLOCK_COLORS.plaintext}`;

	const inputClassNamesIV: Record<number, string> = {};
	inputClassNamesIV[blockSize - 2] = `border-r-${BLOCK_COLORS.ciphertext}`;
	inputClassNamesIV[blockSize - 1] = `border-${BLOCK_COLORS.ciphertext}`;

	const inputClassNamesFN: Record<number, string> = {};
	inputClassNamesFN[blockSize - 2] = `border-r-${BLOCK_COLORS.fnOutput}`;
	inputClassNamesFN[blockSize - 1] = `border-${BLOCK_COLORS.fnOutput}`;

	const numBlocks = $derived(ciphertextBlocks.length);
	let guessedOutputBlock: number[] = $state(new Array(blockSize).fill(undefined));
	let guessedPlaintextBlock: number[] = $state(new Array(blockSize).fill(undefined));

	async function findValidPadding() {
		showSuccess = false;
		attackInProgress = true;
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
			}
		});

		stopAutoGuess();
		attackInProgress = false;
		showSuccess = true;
		attackProgress = 1;
	}

	let attackProgress = $state(0);
	let attackInProgress = $state(false);
	let currentlyAttackedPlaintextBlock = $state(0);

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
		if (index === ciphertextBlocks.length - 1) {
			return extractPaddingError(paddingValidation);
		} else if (attackInProgress && currentlyAttackedPlaintextBlock === index && paddingValidation) {
			return extractPaddingError(paddingValidation);
		} else {
			return undefined;
		}
	}

	function simulateEdgeCase() {
		initializationVector[initializationVector.length - 1] = 0xa0;
		plaintextBlock = new Array(blockSize).fill(0x02);
		resetCiphertext();
	}
</script>

{#snippet ByteRecoverer()}
	<div class="flex flex-col gap-2">
		<div class="flex flex-wrap gap-1">
			<button type="button" class="button-default input-color-level-2" onclick={resetCiphertext}>
				Reset
			</button>

			<button
				type="button"
				class="flex-1 button-default input-color-level-2"
				onclick={findValidPadding}
			>
				Automatically find valid padding
			</button>
		</div>

		<div>
			<p>Progress: {attackProgress * 255} / 255</p>

			<progress class="w-full input-color-level-2" value={attackProgress} max={1}> </progress>

			{#if showSuccess}
				<p class="lockin-animation font-bold">
					Recovered plaintext byte: <span class={`text-${BLOCK_COLORS.plaintext} font-bold`}>
						{displayByte(guessedPlaintextBlock[blockSize - 1], settingsState.displayBytesAs, true)}
					</span>
				</p>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet example()}
	<div class="not-prose flex w-full flex-col gap-1">
		<p>Try it out: Modify the IV until you get valid padding</p>

		<Divider className="my-4 text-secondary text-base" text="or automatically" />

		{@render ByteRecoverer()}
	</div>
{/snippet}

{#snippet exampleEdgeCase()}
	<div class="not-prose flex w-full flex-col gap-4">
		<div class="grid grid-cols-5 gap-4">
			<p class="col-span-3">
				Set the plaintext and iv to a specific value, to simulate finding 0x02 instead of 0x01
			</p>
			<div class="col-span-2 flex-center">
				<button type="button" class="button-default input-color-level-2" onclick={simulateEdgeCase}>
					Simulate edge case
				</button>
			</div>
		</div>

		<hr class="border-surface-a20 my-3"/>

		{@render ByteRecoverer()}
	</div>
{/snippet}

<StorySection id="exploiting-finding-byte-length">
	{#snippet children()}
		<h3>Exploiting - Recovering a single byte</h3>

		<p>
			Even worse, a padding oracle can be used to gain information about the decrypted plaintext and
			even further to completely recover it
		</p>

		<Card title="Question" className="text-center">Can you think of a way to exploit this?</Card>

		<!-- <p class="text-secondary m-0!">First set the IV to zero</p> -->
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
						guessedOutputBlock[guessedOutputBlock.length - 1],
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
				by xoring with the original
				<span class={`text-${BLOCK_COLORS.ciphertext}`}>last byte of the IV</span>:
			</p>

			<p class="text-center">
				<span class="text-blue-400">P[-1]</span> = <span class="text-green-400">IV[-1]</span>
				XOR
				<span class="text-red-500">DEC[-1]</span>
			</p>

			<p class="text-center">
				<span class="text-blue-400">
					{displayByte(
						guessedPlaintextBlock[guessedPlaintextBlock.length - 1],
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
						guessedOutputBlock[guessedOutputBlock.length - 1],
						settingsState.displayBytesAs,
						true
					)}
				</span>
			</p>
		</div>

		<ExplainWrapper slides={[example]} title="Interactive Example"></ExplainWrapper>

		<!-- <p>
			How do we extend this to recover more bytes? You can then modify the last two bytes of the IV to get information about the
		</p> -->

		<h3>Edge cases</h3>
		<p>
			A valid padding result probably indicates that you set the last byte of the decrypted
			plaintext to 0x01. However, there are some edge cases to consider.
		</p>

		<Question id="valid-padding-plaintext-edge-cases" className="mb-8">
			{#snippet question()}
				<p class="my-0! text-center">Can you think of an exception?</p>
				<ul class="not-prose list-disc px-4">
					<li>
						<Spoiler surfaceLevel={2} remember={true}
							>What if the last byte of the decrypted plaintext is set to 0x01?
						</Spoiler>
					</li>
					<li>
						<Spoiler surfaceLevel={2}>
							What if the last byte of the decrypted plaintext is set to 0x02?
						</Spoiler>
					</li>
					<li>
						<Spoiler surfaceLevel={2}>
							In which cases would this still lead to valid padding?
						</Spoiler>
					</li>
					<li>
						<Spoiler surfaceLevel={2}>How do other validly padded plaintext blocks look?</Spoiler>
					</li>
				</ul>
			{/snippet}

			{#snippet reveal()}
				<p>
					Suppose the penultimate byte of the decrypted plaintext is 0x02. You will then get a valid
					padding result if you set the last byte of the decrypted plaintext to <span
						class="font-bold">0x02</span
					> or 0x01.
				</p>

				<p>
					In general, if the last n bytes of the decrypted plaintext are all set to n (e.g. 0x02
					0x02, or 0x03 0x03 0x03), you would get valid padding by setting the last byte to n or
					0x01.
				</p>
			{/snippet}
		</Question>

		<ExplainWrapper slides={[exampleEdgeCase]} title="Interactive Example"></ExplainWrapper>
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
					<Block bytes={guessedOutputBlock} inputClassNames={inputClassNamesFN} />
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
