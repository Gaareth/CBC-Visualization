<script lang="ts">
	import Block from '$lib/components/shared/Block.svelte';
	import Card from '$lib/components/shared/Card.svelte';
	import CBC from '$lib/components/CBC/CBC.svelte';
	import CBCDecryption from '$lib/components/CBC/CBCDecryption.svelte';
	import ExplainWrapper from '$lib/components/shared/ExplainWrapper.svelte';

	import { cbcDecrypt, cbcEncrypt, cbcEncryptBlocks } from '$lib/logic/cbc';
	import { stringToArray, oneTimePad } from '$lib/logic/crypto-utils';

	import { PKCS7Padder } from '$lib/logic/padding';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { updateBlock } from '$lib/utils/reactivity.svelte';
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

	const padder = new PKCS7Padder();

	let plaintext = 'ORACLE';
	let plaintextBlock = stringToArray(plaintext);
	let initializationVector = $state([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
	let key = [0, 0, 0, 0, 0, 0, 0, 0];

	let { ciphertextBlocks } = $state(
		cbcEncrypt(plaintextBlock, key, initializationVector, oneTimePad, padder)
	);

	let plaintextBlocks = $derived(cbcDecrypt(ciphertextBlocks, key, oneTimePad));

	function createPaddingError() {
		const lastIndex = initializationVector.length - 1;
		ciphertextBlocks[0][lastIndex] = (ciphertextBlocks[0][lastIndex] + 1) % 256;
	}
</script>

{#snippet simulateButton()}
	<div class="not-prose flex w-full flex-col gap-1">
		<p>Try it out!</p>
		<button type="button" class="button-default input-color-level-2" onclick={createPaddingError}>
			Simulate Padding Error
		</button>
		<p class="text-sm text-secondary">
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

<StorySection id="oracle">
	{#snippet children()}
		<h2>What is a Padding Oracle?</h2>

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
		<div class={cn('not-prose flex w-fit justify-end')}>
			<CBC
				{plaintextBlocks}
				bind:ciphertextBlocks
				encryptionMode={false}
				onIVChange={(bytes) => {
					console.log('IV changed', bytes);
					ciphertextBlocks[0] = bytes.map((b) => b ?? 0) as number[];
				}}
				{padder}
				addInitPadding={true}
			/>
		</div>
	{/snippet}
</StorySection>
