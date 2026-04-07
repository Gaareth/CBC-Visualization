<script lang="ts">
	import Card from '$lib/Card.svelte';
	import CBC from '$lib/CBC.svelte';
	import { STYLE_CONSTANTS } from '$lib/CBCBlock.svelte';
	import { getSectionContext } from '$lib/contexts/scrollStoryContext';
	import FloatingInput from '$lib/FloatingInput.svelte';
	import { cbcEncryptBlocks } from '$lib/logic/cbc';
	import { stringToArray, oneTimePad } from '$lib/logic/crypto-utils';
	import { PKCS7Padder } from '$lib/logic/padding';
	import NumberInput from '$lib/NumberInput.svelte';
	import StorySection from '$lib/StorySection.svelte';
	import { cn } from '$lib/utils/styling';

	const id = 'padding';

	const padder = new PKCS7Padder();

	let defaultPlaintext = 'Hello World!';
	let plaintext = $derived(defaultPlaintext.slice(0, 5));
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector = $state([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
	let key = [0, 0, 0, 0, 0, 0, 0, 0];

	let plaintextBlocks = $derived(padder.padd(plaintextBlock, initializationVector.length));

	let ciphertextBlocks = $derived(
		cbcEncryptBlocks(plaintextBlocks, key, initializationVector, oneTimePad)
	);

	function oninput(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.value.length < 1) {
			return;
		}
		plaintext = target.value;
	}

	const ctxt = getSectionContext();

	$effect(() => {
		if (!ctxt.ctxt) return;
		if (ctxt.ctxt.activeId !== id) return;

		// if (plaintextBlocks.length >= 2) {
		// 	ctxt.ctxt.shouldWrap = true;
		// } else {
		// 	ctxt.ctxt.shouldWrap = false;
		// }

		const numBlocks = plaintextBlocks.length;
		let diagramWidth =
			numBlocks * (STYLE_CONSTANTS.blockWidth + STYLE_CONSTANTS.gap) - STYLE_CONSTANTS.gap;

		diagramWidth += STYLE_CONSTANTS.leftPadding;

		console.log(
			'diagram width:',
			diagramWidth,
			'visual column width:',
			ctxt.ctxt.visualColumnWidth
		);

		if (diagramWidth > ctxt.ctxt.visualColumnWidth!) {
			ctxt.ctxt.shouldWrap = true;
		} else {
			ctxt.ctxt.shouldWrap = false;
		}
	});
</script>

<StorySection {id}>
	{#snippet children()}
		<h2>What is Padding?</h2>
		<p>
			Block ciphers operate on fixed-size blocks. When the plaintext doesn't fit perfectly into
			blocks, we need to add some extra bytes to fill the last block. This process is called
			padding. One common padding scheme is PKCS#7, which adds bytes with a value equal to the
			number of padding bytes added.
		</p>

		<p>
			However, if the message requires no padding, a complete block fully filled with padding bytes
			is added. This is necessary to ensure that the decryption process can always unambiguously
			determine the padding length and remove it correctly.
		</p>

		<Card title="Interactive Example">
			<div class="not-prose flex w-full flex-col gap-1">
				<p>Try it out!</p>
				<div class="flex w-full gap-1">
					<NumberInput
						surfaceLevel={2}
						value={plaintext.length}
						min={1}
						max={defaultPlaintext.length}
						onChange={(value) => {
							plaintext = defaultPlaintext.slice(0, value);
						}}
						className="w-1/2"
					/>

					<FloatingInput
						label="Plaintext"
						value={plaintext}
						{oninput}
						className="input-color-level-2!"
						wrapperClass="w-1/2"
					/>
				</div>
				<p class="text-sm text-secondary">
					Change the plaintext length to see how padding works! Or choose a different plaintext.
				</p>
			</div>
		</Card>
	{/snippet}

	{#snippet visualSnippet()}
		<div
			class={cn('not-prose flex w-fit justify-end', ctxt.ctxt?.shouldWrap ? 'justify-center' : '')}
		>
			<CBC bind:plaintextBlocks {ciphertextBlocks} encryptionMode={true} addInitPadding={true} />
		</div>
	{/snippet}
</StorySection>
