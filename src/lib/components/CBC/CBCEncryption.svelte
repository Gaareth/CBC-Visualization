<script lang="ts">
	import CBC from '$lib/components/CBC/CBC.svelte';
	import type { SvelteComponent } from 'svelte';
	import { oneTimePad, stringToArray } from '../../logic/crypto-utils';
	import { cbcEncrypt, cbcEncryptBlocks } from '../../logic/cbc';
	import ExplainWrapper from '../shared/ExplainWrapper.svelte';
	import { PKCS7Padder } from '../../logic/padding';
	import FloatingInput from '../ui/FloatingInput.svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const padder = new PKCS7Padder();

	let plaintext = $state('Hello, World!');
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector = $state([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
	let key = [0, 0, 0, 0, 0, 0, 0, 0];

	let plaintextBlocks = $derived(padder.padd(plaintextBlock, initializationVector.length));

	let ciphertextBlocks = $derived(
		cbcEncryptBlocks(plaintextBlocks, key, initializationVector, oneTimePad)
	);

	let cbc: SvelteComponent;

	function oninput(event: Event) {
		const target = event.target as HTMLInputElement;
		plaintext = target.value;
	}

	let arrowsRotated = $state(false);
	function rotateArrows() {
		cbc.rotateArrows();
		arrowsRotated = !arrowsRotated;
	}

	function onIVChange(bytes: (number | undefined)[]) {
		initializationVector = bytes.map((b) => b ?? 0) as number[];
	}
</script>

{#snippet explain()}
	<div class="grid grid-cols-2 items-center gap-10">
		<div>
			<p class="text-justify">
				Chained Block Cipher (CBC) is a mode of operation for block ciphers that chains each
				ciphertext block with the next plaintext block by xoring them.
			</p>
		</div>

		<div class="flex justify-center gap-1">
			<div class="flex w-fit flex-col gap-1">
				<p>Try it out!</p>
				<FloatingInput
					label="Plaintext"
					value={plaintext}
					{oninput}
					wrapperClass="w-fit"
					surfaceLevel={2}
				/>
				<p class="text-sm text-muted-foreground">Or directly change the individual plaintext bytes.</p>
			</div>
		</div>
	</div>
{/snippet}

{#snippet todecrypt()}
	<div class="my-auto grid grid-cols-2 items-center gap-10">
		<div>
			<p class="text-justify">
				From encryption to decryption, CBC works in the exact same way, just in reverse order.
				Simply reverse the direction of the vertical arrows.
			</p>
			{#if arrowsRotated}
				<p class="mt-1" in:fade>
					Finally just flip the diagram for a more intuitive visualization!
				</p>
			{/if}
		</div>
		<div class="flex-center flex flex-col justify-center gap-1">
			<div class="flex flex-col gap-1">
				<p class="text-left">Try it out!</p>
				<button type="button" class="button-default input-layer-2" onclick={rotateArrows}>
					{arrowsRotated ? 'Back to Encryption View' : 'Switch to Decryption View'}
				</button>
				{#if arrowsRotated}
					<a type="button" class="button-default input-layer-2" href="/decryption">
						Flip diagram to continue to decryption
					</a>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-10">
	<ExplainWrapper
		wrapperClass="w-4xl h-fit"
		title="CBC Encryption"
		slides={[explain, todecrypt]}
		slideWrapperClass="my-auto"
		next={() => goto(resolve('/decryption'))}
	></ExplainWrapper>

	<CBC bind:plaintextBlocks {ciphertextBlocks} encryptionMode={true} bind:this={cbc} {onIVChange} />
</div>
