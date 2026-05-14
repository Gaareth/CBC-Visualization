<script lang="ts">
	import { stringToArray } from '$lib/logic/crypto-utils';
	import { type PaddingOracle } from '$lib/logic/paddingOracle';
	import Question from '$lib/components/shared/Question.svelte';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { BLOCK_COLORS, cn } from '$lib/utils/styling';
	import Equal from '@lucide/svelte/icons/equal';

	import ByteRecoverer from '$lib/components/CBCInteractions/ByteRecoverer.svelte';
	import ExplainWrapper from '$lib/components/shared/ExplainWrapper.svelte';
	import { encryptCBCWithContext, decryptCBCWithContext } from '$lib/logic/cbc-service';
	import { settingsState } from '$lib/stores/settings.svelte';
	import { resolve } from '$app/paths';
	import PlaintextColor from '$lib/components/CBC/Colored/PlaintextColor.svelte';
	import CiphertextColor from '$lib/components/CBC/Colored/CiphertextColor.svelte';
	import CBCColored from '$lib/components/CBC/Colored/CBCColored.svelte';

	let plaintext = $state('BYTES');
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector = $state(
		new Uint8Array([0x10, 0xf0, 0xf0, 0x42, 0x00, 0xfe, 0xb0, 0xff])
	);

	let { ciphertextBlocks, key, padder, paddingScheme } = $derived(
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
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
	);

	let guessedPlaintextBlocks: (number | undefined)[][] = $derived(
		Array.from({ length: numBlocks }, () => new Array(blockSize).fill(undefined))
	);
</script>

{#snippet QuestionHowNext()}
	<Question id="second-to-last-byte">
		{#snippet question()}
			<ol class="my-0! list-disc">
				<li>How can we apply this to the second to last byte?</li>

				<li>
					What conditions must be met, so a valid padding is obtained and information about the
					<PlaintextColor>second to last byte of the decrypted plaintext</PlaintextColor>
					is gained?
				</li>
			</ol>
		{/snippet}

		{#snippet reveal()}
			<p>
				Just similarly bruteforcing the
				<CiphertextColor>second to last iv byte</CiphertextColor>
				until we get valid padding won't work, because not only the
				<PlaintextColor>penultimate plaintext byte</PlaintextColor>
				has to be valid padding but also all the following bytes.
			</p>

			<p>
				So we also need to ensure that the
				<PlaintextColor>
					<span class="font-bold">last</span> plaintext byte
				</PlaintextColor>
				is 0x02, before we bruteforce the
				<span class={`text-${BLOCK_COLORS.ciphertext}`}> second to last iv byte </span>. How? By
				modifying the
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
{/snippet}

{#snippet FurtherActions()}
	<h4>Further actions</h4>
	<p>
		Congratulations! You can now try it out for multiple blocks <a
			href={resolve('/padding-oracle-attack')}
		>
			here
		</a>
		or/and deepen your understanding of the attack by reading through
		<a href="https://www.nccgroup.com/research/cryptopals-exploiting-cbc-padding-oracles/">
			this fantastic article
		</a>.
	</p>

	<p>
		You could also change the cipher and <strike>TODO: the padding scheme</strike> in the settings and
		restart from the beginning.
	</p>
{/snippet}

{#snippet MultipleBlocks()}
	<h4>How do we extend this to multiple blocks?</h4>

	<p>
		Moving to the next block is straightforward: you simply send a different pair of ciphertext
		blocks to the padding oracle.
	</p>

	<p>
		For example, to recover the last plaintext block (so plaintextblocks[-1]), the padding oracle
		needs ciphertextblocks[-2] (as IV) and ciphertextblocks[-1]. For the second to last block, the
		padding oracle needs ciphertextblocks[-3] (as IV) and ciphertextblocks[-2], and so on.
	</p>

	<p>
		In general, to recover plaintext block P[i], you always submit the pair (C[i−1], C[i]) to the
		padding oracle and repeat the above attack procedure.
	</p>
{/snippet}

<StorySection title="Exploiting - Recovering Bytes" headingLevel={3}>
	<!-- <h3>Exploitation - Recovering Bytes</h3> -->
	<p class="my-0!">Some remaining questions:</p>
	<ol class="my-0! list-disc">
		<li>How do we now recover more than just a single byte?</li>

		<li>
			or to begin with: How can we use the padding oracle to recover information about the second to
			last byte?
		</li>
	</ol>

	<p>
		For the last byte, we simply "bruteforced" the
		<CiphertextColor className="font-bold">last iv byte</CiphertextColor> until the padding was valid,
		which then revealed that the last byte of the decrypted
		<PlaintextColor>plaintext</PlaintextColor>
		was 0x01.
	</p>

	{@render QuestionHowNext()}

	<p>
		How to set the last <PlaintextColor>plaintext</PlaintextColor> byte to 0x02? Remember, we just recovered
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

	<ExplainWrapper title="Interactive Example - Full Recovery">
		<div class="not-prose">
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
		</div>
	</ExplainWrapper>

	{@render MultipleBlocks()}

	{@render FurtherActions()}

	{#snippet visualSnippet()}
		<h2 class="mb-10 text-center text-2xl font-bold">Recovering Multiple Bytes</h2>
		<div class={cn('not-prose flex w-fit justify-end')}>
			<CBCColored
				plaintextBlock={plaintextBlocks[0]}
				ciphertextBlock={ciphertextBlocks[1]}
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
