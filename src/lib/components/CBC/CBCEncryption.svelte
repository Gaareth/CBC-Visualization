<script lang="ts">
	import CBC from '$lib/components/CBC/CBC.svelte';
	import type { SvelteComponent } from 'svelte';
	import { stringToArray } from '../../logic/crypto-utils';
	import { cbcEncryptBlocks } from '../../logic/cbc';
	import ExplainWrapper from '../shared/ExplainWrapper.svelte';
	import FloatingInput from '../ui/FloatingInput.svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		encryptCBCWithContext,
		getBlockCipher,
		getCBCSettings,
		getKey,
		getPadder
	} from '$lib/logic/cbc-service';
	import { settingsState } from '$lib/stores/settings.svelte';

	let plaintext = $state('Hello, World!');
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector: Uint8Array = $state(
		new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01])
	);

	const { padder, key, cipher } = $derived(getCBCSettings(plaintextBlock, settingsState));
	let plaintextBlocks = $derived(padder.pad(plaintextBlock, initializationVector.length));
	let ciphertextBlocks = $derived(
		cbcEncryptBlocks(plaintextBlocks, key, initializationVector, cipher.encrypt)
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

	function onChangeIV(bytes: Uint8Array) {
		initializationVector = bytes;
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
				<p class="text-sm text-muted-foreground">
					Or directly change the individual plaintext bytes.
				</p>
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

	<CBC
		bind:plaintextBlocks
		{ciphertextBlocks}
		encryptionMode={true}
		bind:this={cbc}
		{onChangeIV}
		onPlaintextChange={(blocks) => {
			plaintextBlocks = blocks;
			plaintextBlocks = [...plaintextBlocks];
		}}
	/>
</div>
