<script lang="ts">
	import CBC from '$lib/components/CBC/CBC.svelte';
	import type { SvelteComponent } from 'svelte';
	import { oneTimePad, stringToArray } from '../../logic/crypto-utils';
	import { cbcDecrypt, cbcEncrypt, cbcEncryptBlocks } from '../../logic/cbc';
	import ExplainWrapper from '../shared/ExplainWrapper.svelte';
	import { PKCS7Padder } from '../../logic/padding';
	import FloatingInput from '../ui/FloatingInput.svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Block from '../shared/Block.svelte';
	import { updateBlock } from '../../utils/reactivity.svelte';

	const padder = new PKCS7Padder();

	let plaintext = $state('HELLO WORLD');
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector = $state([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
	let key = [0, 0, 0, 0, 0, 0, 0, 0];

	// let plaintextBlocks = $derived(padder.padd(plaintextBlock, initializationVector.length));

	// let ciphertextBlocks = $state(
	// 	cbcEncryptBlocks(plaintextBlocks, key, initializationVector, oneTimePad)
	// );

	let { ciphertextBlocks } = $state(
		cbcEncrypt(plaintextBlock, key, initializationVector, oneTimePad, padder)
	);

	let plaintextBlocks = $derived(cbcDecrypt(ciphertextBlocks, key, oneTimePad));

	let cbc: SvelteComponent;

	function oninput(event: Event) {
		const target = event.target as HTMLInputElement;
		plaintext = target.value;
	}

	function modifyIV() {
		const lastIndex = initializationVector.length - 1;

		ciphertextBlocks = updateBlock(ciphertextBlocks, 0, (block) => {
			block[lastIndex] = (block[lastIndex] + 1) % 256;
		});
	}

	function createPaddingError() {
		const blockIndex = ciphertextBlocks.length - 2;
		const lastIndex = initializationVector.length - 1;

		ciphertextBlocks = updateBlock(ciphertextBlocks, blockIndex, (block) => {
			block[lastIndex] = (block[lastIndex] + 1) % 256;
		});
	}
</script>

{#snippet explain()}
	<div class="grid grid-cols-2 items-center gap-10">
		<div>
			<p class="text-justify">Decryption is just reversed encryption.</p>
			<p>Try changing the last byte of the IV to see how it affects the first plaintext block.</p>
		</div>

		<div class="flex justify-center gap-1">
			<div class="flex w-fit flex-col gap-1">
				<p>Try it out!</p>
				<button type="button" class="button-default input-color-level-2" onclick={modifyIV}>
					Change last IV byte
				</button>
				<p class="text-sm text-muted-foreground">Or directly change the arbitrary ciphertext/iv bytes.</p>
			</div>
		</div>
	</div>
{/snippet}

{#snippet toAttack()}
	<div class="grid grid-cols-2 items-center gap-10">
		<div>
			<p class="text-justify">
				CBC mode requires padding (here <a href="https://en.wikipedia.org/wiki/PKCS_7">PKCS#7</a>)
				when the plaintext is not a multiple of the block size.
			</p>

			<p class="mt-2 text-justify">
				If the padding validation result is given to an attacker, the plaintext may be recoverable
				through a padding oracle attack.
			</p>
		</div>

		<div class="flex justify-center gap-1">
			<div class="flex w-fit flex-col gap-1">
				<p>Try it out!</p>

				<button
					type="button"
					class="button-default input-color-level-2"
					onclick={createPaddingError}
				>
					Simulate Padding Error
				</button>
				<p class="text-sm text-muted-foreground">
					by modifying the last byte of the penultimate ciphertext block
				</p>
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-10">
	<ExplainWrapper
		wrapperClass="w-4xl h-fit"
		title="CBC Decryption"
		slides={[explain, toAttack]}
		back={() => goto(resolve('/encryption'))}
		next={() => goto(resolve('/padding-oracle-attack'))}
		slideWrapperClass="my-auto"
	></ExplainWrapper>

	<CBC
		{plaintextBlocks}
		bind:ciphertextBlocks
		encryptionMode={false}
		bind:this={cbc}
		onIVChange={(bytes) => {
			// ciphertextBlocks[0] = bytes.map((b) => b ?? 0) as number[];
		}}
		{padder}
	/>
</div>
