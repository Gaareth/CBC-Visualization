<script lang="ts">
	import Divider from '$lib/components/shared/Divider.svelte';
	import ExplainWrapper from '$lib/components/shared/ExplainWrapper.svelte';
	import { stringToArray } from '$lib/logic/crypto-utils';
	import { type PaddingOracle } from '$lib/logic/paddingOracle';
	import Question from '$lib/components/shared/Question.svelte';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { getRandomInt } from '$lib/utils/compute';
	import { cn } from '$lib/utils/styling';
	import Spoiler from '$lib/components/shared/Spoiler.svelte';
	import { toast } from 'svelte-sonner';
	import ByteRecoverer from '$lib/components/CBCInteractions/ByteRecoverer.svelte';
	import { fade } from 'svelte/transition';
	import { encryptCBCWithContext, decryptCBCWithContext } from '$lib/logic/cbc-service';
	import { settingsState } from '$lib/stores/settings.svelte';
	import CBCColored from '$lib/components/CBC/Colored/CBCColored.svelte';
	import PlaintextColor from '$lib/components/CBC/Colored/PlaintextColor.svelte';
	import CiphertextColor from '$lib/components/CBC/Colored/CiphertextColor.svelte';

	let showRecoverer = $state(false);

	let plaintext = $state('EDGES');
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector = $state(
		new Uint8Array([0x10, 0xf0, 0xf0, 0x42, 0x00, 0xfe, 0xb0, 0xff])
	);

	let { ciphertextBlocks, key, padder } = $derived(
		encryptCBCWithContext(plaintextBlock, initializationVector, settingsState)
	);

	let plaintextBlocks = $derived(decryptCBCWithContext(ciphertextBlocks, key, settingsState));

	const blockSize = $derived(ciphertextBlocks[0].length);

	let paddingValidation: ReturnType<typeof padder.validatePadding> = $derived(
		padder.validatePadding(plaintextBlocks[plaintextBlocks.length - 1])
	);

	const paddingOracle: PaddingOracle = (cBlocks) => {
		const decrypted = decryptCBCWithContext(cBlocks, key, settingsState);
		const lastBlock = decrypted[decrypted.length - 1];

		const result = padder.validatePadding(lastBlock);
		paddingValidation = result;

		return result.valid;
	};

	function resetCiphertext() {
		ciphertextBlocks = encryptCBCWithContext(
			plaintextBlock,
			initializationVector,
			settingsState
		).ciphertextBlocks;
	}

	const numBlocks = $derived(ciphertextBlocks.length);
	let guessedOutputBlocks: (number | undefined)[][] = $derived(
		new Array(numBlocks).fill(new Array(blockSize).fill(undefined))
	);
	let guessedPlaintextBlocks: (number | undefined)[][] = $derived(
		new Array(numBlocks).fill(new Array(blockSize).fill(undefined))
	);

	function simulateEdgeCase() {
		showRecoverer = true;

		const paddingByte = getRandomInt(2, blockSize - 1);
		initializationVector[initializationVector.length - 1] = 0xa0;

		plaintextBlock = new Uint8Array(blockSize - paddingByte).fill(paddingByte);
		resetCiphertext();

		toast.info('Updated blocks', {
			description: 'The IV and plaintext have been updated to simulate the edge case.',
			duration: 1000
		});
	}
</script>

{#snippet exampleEdgeCase()}
	<div class="not-prose flex w-full flex-col gap-4">
		<div class="grid grid-cols-5 gap-4">
			<p class="col-span-3">
				Set the
				<PlaintextColor>plaintext</PlaintextColor>
				and
				<CiphertextColor>IV</CiphertextColor>

				to specific values to simulate incorrectly finding, for example, 0x02 instead of 0x01.
			</p>
			<div class="col-span-2 flex-center">
				<button type="button" class="button-default input-layer-2" onclick={simulateEdgeCase}>
					Simulate edge case
				</button>
			</div>
		</div>

		<Divider className="text-muted-foreground" hideText={showRecoverer} surfaceLevel={1}>
			<button class="m-0! text-sm" onclick={() => (showRecoverer = true)} out:fade>
				or use current values
			</button>
		</Divider>

		{#if showRecoverer}
			<div in:fade>
				<ByteRecoverer
					{plaintextBlocks}
					bind:ciphertextBlocks
					{guessedOutputBlocks}
					{paddingOracle}
					{guessedPlaintextBlocks}
					{resetCiphertext}
					showEdgeCheckSwitch={true}
					autoRunEnabled={false}
					multipleBytes={false}
				/>
			</div>
		{/if}
	</div>
{/snippet}

<StorySection title="Edge cases" headingLevel={3}>
	{#snippet children()}
		<p>
			A valid padding result probably indicates that you set the last byte of the decrypted
			plaintext to
			<PlaintextColor>0x01</PlaintextColor>. However, there are some edge cases to consider.
		</p>

		<Question
			id="valid-padding-plaintext-edge-cases"
			className="mb-8"
			title="Can you think of an exception?"
		>
			{#snippet question()}
				<p class="text-center">
					Can you think of exceptions, where the padding oracle result is valid but the last byte of
					the decrypted plaintext is not <PlaintextColor>0x01</PlaintextColor>?
				</p>
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
				<p class="mt-0!">
					Suppose the <span class="font-bold">penultimate</span> byte of the decrypted plaintext is
					<PlaintextColor>0x02</PlaintextColor>. You will then get a valid padding result if you set
					the last byte of the decrypted plaintext to
					<PlaintextColor className="font-bold">0x02</PlaintextColor> or
					<PlaintextColor>0x01</PlaintextColor>.
				</p>

				<p>
					In general, if the last n bytes of the decrypted
					<PlaintextColor>plaintext</PlaintextColor> block are all set to n (e.g. 0x02 0x02, or 0x03 0x03
					0x03), you would get valid padding by setting the last byte to n or 0x01.
				</p>
			{/snippet}
		</Question>

		<ExplainWrapper slides={[exampleEdgeCase]} title="Interactive Example - Edge Cases"
		></ExplainWrapper>
	{/snippet}

	{#snippet visualSnippet()}
		<h2 class="mb-10 text-center text-2xl font-bold">Edge case simulation</h2>
		<div class={cn('not-prose flex w-fit justify-end')}>
			<CBCColored
				plaintextBlock={plaintextBlocks[0]}
				bind:ciphertextBlock={ciphertextBlocks[1]}
				initializationVector={ciphertextBlocks[0]}
				guessedOutputBlock={guessedOutputBlocks[1]}
				{paddingValidation}
				onChangeCiphertext={(bytes) => {
					ciphertextBlocks[1] = bytes;
					ciphertextBlocks = [...ciphertextBlocks];
				}}
				onChangeIV={(bytes) => {
					ciphertextBlocks[0] = bytes;
					ciphertextBlocks = [...ciphertextBlocks];
				}}
			/>
		</div>
	{/snippet}
</StorySection>
