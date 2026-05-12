<script lang="ts">
	import CBC from '$lib/components/CBC/CBC.svelte';
	import ExplainWrapper from '$lib/components/shared/ExplainWrapper.svelte';
	import { stringToArray } from '$lib/logic/crypto-utils';
	import { encryptCBCWithContext, decryptCBCWithContext } from '$lib/logic/cbc-service';
	import { settingsState } from '$lib/stores/settings.svelte';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { cn } from '$lib/utils/styling';

	import hljs from 'highlight.js/lib/core';
	import javascript from 'highlight.js/lib/languages/javascript';
	hljs.registerLanguage('typescript', javascript);

	import 'highlight.js/styles/github-dark.css';

	const paddingOracleCode = `const paddingOracle: PaddingOracle = (ciphertextBlocks) => {
  const decrypted = cbcDecrypt(ciphertextBlocks, key, BlockCipherFunction);
  const lastBlock = decrypted[decrypted.length - 1];
  const result = padder.validatePadding(lastBlock);
  return result.valid;
};
`;

	const paddingOracleHtml = hljs.highlight(paddingOracleCode, {
		language: 'typescript'
	}).value;

	let plaintext = 'ORACLE';
	let plaintextBlock = stringToArray(plaintext);
	let initializationVector = $state(
		new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
	);

	let { ciphertextBlocks, key, padder } = $derived(
		encryptCBCWithContext(plaintextBlock, initializationVector, settingsState)
	);

	let plaintextBlocks = $derived(decryptCBCWithContext(ciphertextBlocks, key, settingsState));

	function createPaddingError() {
		const blockIndex = ciphertextBlocks.length - 2;
		const lastIndex = initializationVector.length - 1;

		const modifiedBlock = new Uint8Array(ciphertextBlocks[blockIndex]);
		modifiedBlock[lastIndex] = (modifiedBlock[lastIndex] + 1) % 256;
		ciphertextBlocks[blockIndex] = modifiedBlock;
		ciphertextBlocks = [...ciphertextBlocks];
	}
</script>

{#snippet simulateButton()}
	<div class="not-prose flex w-full flex-col gap-1">
		<p>Try it out!</p>
		<button type="button" class="button-default input-layer-2" onclick={createPaddingError}>
			Simulate Padding Error
		</button>
		<p class="text-sm text-muted-foreground">
			by modifying the last byte of the penultimate ciphertext block
		</p>
	</div>
{/snippet}

{#snippet example()}
	<div class="not-prose flex w-full flex-col gap-1">
		<p>Try it out: Change the bytes of the IV or the ciphertext block</p>
		<ol class="list-disc px-4 text-base">
			<li>What do you notice?</li>
			<li>
				Can you detect a difference in the result whether you modified the IV or the ciphertext
				block?
			</li>
			<li>Does a valid/invalid padding tell you something about the plaintext?</li>
		</ol>
	</div>
{/snippet}

<StorySection title="What is a Padding Oracle?" headingLevel={2}>
	{#snippet children()}
		<p>
			If you have a server, that answers you whether a given (and possibly modified) ciphertext has
			invalid padding, you have a padding oracle. This can be exploited to recover the plaintext of
			a ciphertext, without knowing the key.
		</p>

		<details>
			<summary class="cursor-pointer">Padding oracle model as code</summary>
			This is roughly how the oracle is modeled for this visualization:
			<pre class="mt-0!"><code>{@html paddingOracleHtml}</code></pre>
		</details>

		<ExplainWrapper
			title="Interactive Example - Simulating Padding Error"
			wrapperClass="mt-4"
			slidesWrapperClass="items-center"
			slides={[example, simulateButton]}
		></ExplainWrapper>
	{/snippet}

	{#snippet visualSnippet()}
		<h2 class="mb-10 text-center text-2xl font-bold">What is a Padding Oracle?</h2>

		<div class={cn('not-prose flex w-fit justify-end')}>
			<CBC
				{plaintextBlocks}
				bind:ciphertextBlocks
				encryptionMode={false}
				onChangeIV={(bytes) => {
					ciphertextBlocks[0] = bytes;
					ciphertextBlocks = [...ciphertextBlocks];
				}}
				onCiphertextChange={(bytes) => {
					ciphertextBlocks = bytes;
					ciphertextBlocks = [...ciphertextBlocks];
				}}
				{padder}
				addInitPadding={true}
			/>
		</div>
	{/snippet}
</StorySection>
