<script lang="ts">
	import CBC from '$lib/CBC.svelte';
	import { cbcDecrypt, cbcEncrypt } from '$lib/logic/cbc';
	import type { SvelteComponent } from 'svelte';
	import { oneTimePad, stringToArray, xorBlocks } from './logic/crypto-utils';
	import { PKCS7Padder } from './logic/padding';
	import { autoRunGate, createGate, delay } from '$lib/utils/generic';
	import Block from './Block.svelte';
	import { cn } from './utils/styling';
	import {
		findPaddingLengthWithOracle,
		recoverPlaintextWithOracle,
		recoverSingleBlock,
		type PaddingOracle
	} from './logic/paddingOracle';
	import CBCBlock, { STYLE_CONSTANTS } from './CBCBlock.svelte';
	import ExplainWrapper from './ExplainWrapper.svelte';

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
	async function recoverPlaintext() {
		showSuccess = false;
		attackInProgress = true;

		const stopAutoGuess = autoRunGate(guessGate, () => 5);

		await recoverPlaintextWithOracle(ciphertextBlocks, paddingOracle, {
			outGuessedDecBlocks: guessedOutputBlocks,
			outGuessedPlaintextBlocks: guessedPlaintextBlocks,
			guessGate,
			progress: {
				onBlockStart: (i) => {
					currentlyAttackedPlaintextBlock = i - 1;
				}
			}
		});

		stopAutoGuess();
		attackInProgress = false;
		showSuccess = true;
	}

	

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

{#snippet autoRun()}
	<div class="flex flex-col gap-1">
		<div class="flex-center">
			<button class="button-default color-level-2" onclick={async () => await recoverPlaintext()}>
				Recover Plaintext
			</button>
		</div>

		<div class="mx-auto w-fit">
			<p>Recovered Plaintext:</p>
			<div class={cn('flex gap-1', { 'lockin-animation': showSuccess })}>
				{#each { length: guessedPlaintextBlocks.length } as _, i}
					<Block
						bytes={guessedPlaintextBlocks[i + 1]}
						title={`Guessed Plaintext Block ${i}`}
						success={showSuccess}
					/>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

{#snippet explainer()}
	<div class="grid grid-cols-6 items-center gap-10">
		<div class="col-span-4">
			<p class="text-justify">
				You can exploit the padding oracle to find out when the decrypted plaintext has valid
				padding.
			</p>
			<ol class="list-decimal ps-7">
				<li>Set the IV to zero</li>
				<li>
					Change the last byte of the IV until you get valid padding

					<p>
						You now know that the last plaintext byte of P_0 is (likely) <span class="text-blue-400"
							>0x01</span
						><br />
						<span class="text-blue-400">0x01</span> = <span class="text-green-400">IV[-1]</span> XOR
						<span class="text-red-500">DEC[-1]</span>
					</p>
				</li>
				<li>
					Calculate the plaintext byte using XOR operations
					<div>
						<p>
							<span class="text-red-500">DEC[-1]</span> = <span class="text-blue-400">0x01</span>
							XOR
							<span class="text-green-400">IV[-1]</span> XOR = <span class="text-red-500">???</span>
						</p>

						<p>
							<span class="text-blue-400">P[-1]</span> = <span class="text-green-400">IV[-1]</span>
							XOR
							<span class="text-red-500">DEC[-1]</span> = <span class="text-blue-400">???</span>
						</p>
					</div>
				</li>
			</ol>
		</div>

		<div class="col-span-2 flex justify-center gap-1">
			<div class="flex w-fit flex-col gap-1">
				<button type="button" class="button-default input-color-level-2" onclick={zeroIV}>
					Set IV to zero
				</button>

				<button type="button" class="button-default input-color-level-2" onclick={findValidPadding}>
					Find valid padding
				</button>

				<!-- <button type="button" class="button-default input-color-level-2" onclick={calculatePlaintext}>
					Recover plaintext
				</button> -->
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-5">
	<ExplainWrapper
		wrapperClass="w-6xl h-fit"
		title="Padding Oracle Attack on CBC"
		slides={[explainer, autoRun]}
		slideWrapperClass="my-auto"
		onChangeSlide={(index) => {
			if (index === 1) {
				plaintext = 'A SECRET MESSAGE';
			} else {
				plaintext = 'WORLD';
			}
			resetCiphertext();
		}}
	></ExplainWrapper>

	<div class={cn('flex justify-center')} style={`gap: ${STYLE_CONSTANTS.gapToNext}px;`}>
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
