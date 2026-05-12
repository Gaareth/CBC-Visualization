<script lang="ts">
	import Card from '$lib/components/shared/Card.svelte';
	import CBC from '$lib/components/CBC/CBC.svelte';
	import { getSectionContext } from '$lib/contexts/scrollStoryContext';
	import FloatingInput from '$lib/components/ui/FloatingInput.svelte';
	import { stringToArray } from '$lib/logic/crypto-utils';
	import NumberInput from '$lib/components/ui/NumberInput.svelte';
	import StorySection from '$lib/components/shared/StorySection.svelte';
	import { cn } from '$lib/utils/styling';
	import { CBC_LAYOUT, getBlockWidth, getLeftPadding } from '$lib/stores/cbcConstants.svelte';
	import { encryptCBCWithContext } from '$lib/logic/cbc-service';
	import { settingsState } from '$lib/stores/settings.svelte';

	const title = 'What is Padding?';

	let defaultPlaintext = 'Hello World!';
	let plaintext = $derived(defaultPlaintext.slice(0, 5));
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector = $state(
		new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01])
	);

	let { ciphertextBlocks, plaintextBlocks } = $derived(
		encryptCBCWithContext(plaintextBlock, initializationVector, settingsState, false)
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
		if (ctxt.ctxt.activeId !== title) return;

		const numBlocks = plaintextBlocks.length;
		let diagramWidth = numBlocks * (getBlockWidth() + CBC_LAYOUT.gap) - CBC_LAYOUT.gap;

		diagramWidth += getLeftPadding();

		// console.log(
		// 	'diagram width:',
		// 	diagramWidth,
		// 	'visual column width:',
		// 	ctxt.ctxt.visualColumnWidth
		// );

		if (diagramWidth > ctxt.ctxt.visualColumnWidth!) {
			ctxt.ctxt.shouldWrap = true;
		} else {
			ctxt.ctxt.shouldWrap = false;
		}
	});
</script>

<StorySection {title}>
	{#snippet children()}
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

		<Card title="Interactive Example - Understanding Padding">
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
						className="input-layer-2!"
						wrapperClass="w-1/2"
					/>
				</div>
				<p class="text-sm text-muted-foreground">
					Change the plaintext length to see how padding works! Or choose a different plaintext.
				</p>
			</div>
		</Card>
	{/snippet}

	{#snippet visualSnippet()}
		<h2 class="mb-10 text-center text-2xl font-bold">What is Padding?</h2>

		<div
			class={cn('not-prose flex w-fit justify-end', ctxt.ctxt?.shouldWrap ? 'justify-center' : '')}
		>
			<CBC bind:plaintextBlocks {ciphertextBlocks} encryptionMode={true} addInitPadding={true} />
		</div>
	{/snippet}
</StorySection>
