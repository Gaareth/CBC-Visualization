<script lang="ts">
	import { cbcDecrypt, cbcEncrypt } from '$lib/logic/cbc';
	import { oneTimePad, stringToArray } from './logic/crypto-utils';
	import { PKCS7Padder } from './logic/padding';
	import { autoRunGate, createGate } from '$lib/utils/generic';
	import Block from './Block.svelte';
	import { cn, dedent } from './utils/styling';
	import { recoverPlaintextWithOracle, type PaddingOracle } from './logic/paddingOracle';
	import CBCBlock, { STYLE_CONSTANTS } from './CBCBlock.svelte';

	import PaddingLengthFinder from './PaddingLengthFinder.svelte';
	import { cloneBlocks } from './utils/reactivity.svelte';

	// let key = [0x0f, 0x0e, 0x0d, 0x0c, 0x0b, 0x0a, 0x09, 0x08];
	let key = [0, 0, 0, 0, 0, 0, 0, 0];
	let initializationVector = $state([4, 20, 150, 3, 100, 41, 42, 201]);

	let plaintext = $state('HELLO');
	let plaintextBlock = $derived(stringToArray(plaintext));

	let padder = new PKCS7Padder();

	let { ciphertextBlocks } = $state(
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


	let guessGate = $state(createGate());

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
		ciphertextBlocks = cloneBlocks(
			cbcEncrypt(plaintextBlock, key, initializationVector, oneTimePad, padder).ciphertextBlocks
		);

		// ciphertextBlocks = cbcEncrypt(
		// 	plaintextBlock,
		// 	key,
		// 	initializationVector,
		// 	oneTimePad,
		// 	padder
		// ).ciphertextBlocks;

		guessedOutputBlocks = Array.from({ length: numBlocks }, () =>
			new Array(blockSize).fill(undefined)
		);
		guessedPlaintextBlocks = Array.from({ length: numBlocks }, () =>
			new Array(blockSize).fill(undefined)
		);
	}

	function zeroIV() {
		ciphertextBlocks[0] = new Array(blockSize).fill(0);
	}

	async function findValidPadding() {
		showSuccess = false;
		attackInProgress = true;

		const easeOut = (i: number) => {
			const start = 300;
			const end = 20;
			const t = 1 - Math.exp(-i / 5);
			return end + (start - end) * (1 - t);
		};

		let byteGate = createGate();
		const stopAutoGuess = autoRunGate(guessGate, easeOut);
		const stopAutoByte = autoRunGate(byteGate, () => 0);

		await recoverPlaintextWithOracle(ciphertextBlocks, paddingOracle, {
			outGuessedDecBlocks: guessedOutputBlocks,
			outGuessedPlaintextBlocks: guessedPlaintextBlocks,
			guessGate,
			byteGate,
			progress: {
				onBlockStart: (i) => {
					currentlyAttackedPlaintextBlock = i - 1;
				},

				onByteStart: (i) => {
					if (i == 2) {
						console.log('A');

						stopAutoByte();
						stopAutoGuess();
						return;
					}
				}
			}
		});

		stopAutoGuess();
		attackInProgress = false;
		showSuccess = true;
	}

	let isLastBlock = $derived((i: number) => i === decryptedplaintextBlocks.length - 1);
</script>

<div class="mx-auto my-10 max-w-[1400px]">
	<div class="grid grid-cols-2 gap-2 p-5">
		<article class="prose flex flex-col lg:prose-lg dark:prose-invert">
			

			<section>
				<h2>What is a Padding?</h2>
				<p>TODO:</p>
			</section>

			<section>
				<h2>What is a Padding Oracle?</h2>

				<p>
					If you have a server, that answers you whether a given (and possibly modified) ciphertext
					has invalid padding, you have a padding oracle. This can be exploited to recover the
					plaintext of a ciphertext, without knowing the key.
				</p>

				<details>
					<summary class="cursor-pointer">Padding oracle model as code</summary>
					This is roughly how the oracle is modeled for this visualization:
					<pre><code>{@html paddingOracleHtml}</code></pre>
				</details>
			</section>

			<section>
				<h2>Exploiting</h2>
				<p>
					When modifying the IV or the penultimate block, we can make ??? changes to the decrypted
					plaintext. Random changes will likely result in invalid padding, but a valid results tells
					you something about the decrypted plaintext. This can be exploited to recover the
					plaintext byte by byte.
				</p>

				<section>
					<h3>Exploiting - Finding the padding length</h3>
					<div class="flex flex-col gap-1">
						<PaddingLengthFinder
							bind:showSuccess
							{resetCiphertext}
							{ciphertextBlocks}
							{paddingOracle}
							{blockSize}
							paddingValidation={lastBlockPaddingValidationResult}
						/>
					</div>
				</section>

				<section>
					<h3>Exploiting - Recovering a single byte</h3>
					<div class="flex flex-col gap-1">
						<p class="text-secondary">First set the IV to zero</p>
						<p>
							Go through all possible byte values for the last byte of the IV (or the penultimate
							block) until you get valid padding. This tells you that the last byte of the decrypted
							plaintext is (likely*) 0x01.
						</p>
						Try it:
						<button
							type="button"
							class="button-default input-color-level-2"
							onclick={findValidPadding}
						>
							Find valid padding
						</button>
					</div>
				</section>
			</section>
		</article>

		<div class="flex flex-col justify-center gap-5">
			<div class={cn('flex justify-end')} style={`gap: ${STYLE_CONSTANTS.gapToNext}px;`}>
				{#each { length: decryptedplaintextBlocks.length } as _, i}
					<CBCBlock
						encryptionMode={false}
						index={i}
						plaintextBlock={decryptedplaintextBlocks[i]}
						ciphertextBlock={ciphertextBlocks[i + 1]}
						initializationVector={i === 0 ? ciphertextBlocks[0] : undefined}
						isLastBlock={isLastBlock(i)}
						onChangeCiphertext={(bytes) =>
							(ciphertextBlocks[i + 1] = bytes.map((b) => b ?? 0) as number[])}
						onChangeIV={(bytes) => {
							ciphertextBlocks[0] = bytes.map((b) => b ?? 0) as number[];
						}}
					>
						{#snippet PlainTextBlock(index)}
							<Block
								bytes={decryptedplaintextBlocks[index]}
								error={getPaddingErrorForBlock(index)}
								success={showSuccess}
								reserveSpaceForError={true}
								title={`Plaintext Block ${index} (P_${index})`}
							/>
						{/snippet}

						{#snippet FnOutputBlock(index)}
							<Block bytes={guessedOutputBlocks[index + 1]} />
						{/snippet}

						{#snippet VerticalBar()}
							<div
								class="absolute bottom-0 bg-dark dark:bg-light"
								style={`height: ${STYLE_CONSTANTS.toXorLength + STYLE_CONSTANTS.arrowWidth + STYLE_CONSTANTS.gap + 32 + STYLE_CONSTANTS.gap}px;`}
								style:width={`${STYLE_CONSTANTS.arrowThickness}px;`}
								style:right={`-${STYLE_CONSTANTS.arrowThickness / 2}px`}
							></div>
						{/snippet}
					</CBCBlock>
				{/each}
			</div>
		</div>
	</div>
</div>
