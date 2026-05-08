<script lang="ts">
	import CBC from '$lib/components/CBC/CBC.svelte';
	import type { SvelteComponent } from 'svelte';
	import { oneTimePad, stringToArray } from '../../logic/crypto-utils';
	import { cbcDecrypt, cbcEncrypt, cbcEncryptBlocks } from '../../logic/cbc';
	import ExplainWrapper from '../shared/ExplainWrapper.svelte';
	import { PKCS7Padder } from '../../logic/padding';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		decryptCBCWithContext,
		encryptCBCWithContext,
		getBlockCipher,
		getKey,
		getPadder
	} from '$lib/logic/cbc-service';
	import { settingsState } from '$lib/stores/settings.svelte';

	const padder = getPadder(settingsState.paddingScheme);

	let plaintext = $state('HELLO WORLD');
	let plaintextBlock = $derived(stringToArray(plaintext));
	let initializationVector: Uint8Array = $state(
		new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
	);

	let { ciphertextBlocks, key } = $derived(
		encryptCBCWithContext(plaintextBlock, initializationVector, settingsState)
	);

	let plaintextBlocks = $derived(decryptCBCWithContext(ciphertextBlocks, key, settingsState));

	function modifyIV() {
		const lastIndex = initializationVector.length - 1;
		const modifiedIV = new Uint8Array(ciphertextBlocks[0]);
		modifiedIV[lastIndex] = (modifiedIV[lastIndex] + 1) % 256;
		ciphertextBlocks[0] = modifiedIV;
		ciphertextBlocks = [...ciphertextBlocks];
	}

	function createPaddingError() {
		const blockIndex = ciphertextBlocks.length - 2;
		const lastIndex = initializationVector.length - 1;

		const modifiedBlock = new Uint8Array(ciphertextBlocks[blockIndex]);
		modifiedBlock[lastIndex] = (modifiedBlock[lastIndex] + 1) % 256;
		ciphertextBlocks[blockIndex] = modifiedBlock;
		ciphertextBlocks = [...ciphertextBlocks];
	}


		console.log(plaintextBlocks);
	console.log(ciphertextBlocks);
	
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
				<button type="button" class="button-default input-layer-2" onclick={modifyIV}>
					Change last IV byte
				</button>
				<p class="text-sm text-muted-foreground">
					Or directly change the arbitrary ciphertext/iv bytes.
				</p>
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

				<button type="button" class="button-default input-layer-2" onclick={createPaddingError}>
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
		next={() => goto(resolve('/padding-oracle-attack/short-explain'))}
		slideWrapperClass="my-auto"
	></ExplainWrapper>

	<CBC
		{plaintextBlocks}
		bind:ciphertextBlocks
		encryptionMode={false}
		onChangeIV={(bytes) => {
			ciphertextBlocks[0] = bytes;
			ciphertextBlocks = [...ciphertextBlocks];
		}}
		onPlaintextChange={(blocks) => {
			plaintextBlocks = blocks;
			plaintextBlocks = [...plaintextBlocks];
		}}
		onCiphertextChange={(blocks) => {
			ciphertextBlocks = blocks;
			ciphertextBlocks = [...ciphertextBlocks];
		}}
		{padder}
	/>
</div>
