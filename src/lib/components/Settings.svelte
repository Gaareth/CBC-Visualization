<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Settings from '@lucide/svelte/icons/settings';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import {
		BLOCK_CIPHERS,
		DISPLAY_BYTES_AS,
		PADDING_SCHEMES,
		settingsState,
		TODO_BLOCK_CIPHERS,
		TODO_PADDING_SCHEMES
	} from '$lib/stores/settings.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import NumberInput from './ui/NumberInput.svelte';
	import { CBC_LAYOUT } from '$lib/stores/cbcConstants.svelte';
	import { cn } from '$lib/utils';

	let isDarkMode = $state(mode.current === 'dark');
</script>

{#snippet hexSelect()}
	<Label for="byteDisplay">Byte display format</Label>
	<Select.Root type="single" bind:value={settingsState.displayBytesAs}>
		<Select.Trigger class="w-[180px]" id="byteDisplay" surfaceLevel={2}>
			{settingsState.displayBytesAs}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Format</Select.Label>
				{#each DISPLAY_BYTES_AS as format (format)}
					<Select.Item value={format} label={format}>
						{format}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
{/snippet}

{#snippet paddingSelect()}
	<Label for="paddingScheme">Padding Scheme</Label>
	<Select.Root type="single" bind:value={settingsState.paddingScheme}>
		<Select.Trigger class="w-[180px]" id="paddingScheme" surfaceLevel={2}>
			{settingsState.paddingScheme}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Padding</Select.Label>
				{#each PADDING_SCHEMES as scheme (scheme)}
					<Select.Item value={scheme} label={scheme}>
						{scheme}
					</Select.Item>
				{/each}
			</Select.Group>

			<Select.Group>
				<Select.Label>Currently not supported</Select.Label>
				{#each TODO_PADDING_SCHEMES as scheme (scheme)}
					<Select.Item value={scheme} label={scheme} disabled={true}>
						{scheme}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>

	<p class="col-span-2 -mt-2! text-muted-foreground">
		{#if settingsState.paddingScheme === 'PKCS#5/7'}
			Pads with bytes all set to the padding length (E.g., 0x03 0x03 0x03).
		{:else if settingsState.paddingScheme === 'ANSI X9.23 (zeros)'}
			Pads with zeros and sets the last byte to the padding length.
			<span class="text-warning">
				Ideally (and necessarily to be secure), the zero bytes should not be validated; here they
				are checked intentionally to demonstrate the padding-oracle attack.
			</span>
		{:else if settingsState.paddingScheme === 'ANSI X9.23 (random)'}
			Pads with random bytes and sets the last byte to the padding length. Full recovery of the
			plaintext is not possible with this padding scheme.
		{:else if settingsState.paddingScheme === 'ISO/IEC 7816-4 (0x80 then zeros)'}
			Pads with a single 0x80 byte followed by zeros.
		{/if}
	</p>
{/snippet}

{#snippet cipherSelect()}
	<Label for="blockCipher">Block cipher function</Label>
	<Select.Root type="single" bind:value={settingsState.blockCipher}>
		<Select.Trigger class="w-[180px]" id="blockCipher" surfaceLevel={2}>
			{settingsState.blockCipher}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Block Cipher</Select.Label>
				{#each BLOCK_CIPHERS as cipher (cipher)}
					<Select.Item value={cipher} label={cipher}>
						{cipher}
					</Select.Item>
				{/each}
			</Select.Group>

			<Select.Group>
				<Select.Label>Currently not supported</Select.Label>
				{#each TODO_BLOCK_CIPHERS as cipher (cipher)}
					<Select.Item value={cipher} label={cipher} disabled={true}>
						{cipher}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>

	<p class="col-span-2 -mt-2! text-muted-foreground">
		{#if settingsState.blockCipher === 'TEA'}
			TEA (Tiny Encryption Algorithm) is a simple (~20LOC) Feistel cipher. Probably should not be
			used for real applications.
		{:else if settingsState.blockCipher === 'OTP'}
			Simple XOR of the plaintext with a key. However, insecure when used here as a block cipher with key size equal to the block size and with
			reused keys. Try breaking it!
		{/if}
	</p>
{/snippet}

<div class="fixed right-5 bottom-5 z-9999">
	<Dialog.Root>
		<form>
			<Dialog.Trigger
				type="button"
				class={cn(
					buttonVariants({ variant: 'outline', class: 'rounded-full' }),
					'backdrop-blur-3xl'
				)}
			>
				<Settings />
			</Dialog.Trigger>
			<Dialog.Content class="bg-popover/60 backdrop-blur-3xl sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Settings</Dialog.Title>
					<Dialog.Description>Make changes to the settings here. Auto saves.</Dialog.Description>
				</Dialog.Header>
				<!-- <hr class="bg-surface-3" /> -->

				<div class="my-4 grid grid-cols-2 gap-4 gap-y-5">
					<Label for="darkMode">Dark mode</Label>
					<Switch
						id="darkMode"
						onclick={toggleMode}
						checked={isDarkMode}
						class="will-change-transform"
					/>

					<hr class="col-span-2 my-2" />

					<Label for="highlightChanges">Highlight changes</Label>
					<Switch
						id="highlightChanges"
						bind:checked={settingsState.highlightChanges}
						class="will-change-transform"
					/>

					<Label for="byteWidth">Block Byte width (px)</Label>
					<NumberInput
						id="byteWidth"
						bind:value={CBC_LAYOUT.byteWidth}
						min={1}
						max={100}
						surfaceLevel={2}
					/>

					{@render hexSelect()}

					<hr class="col-span-2 my-2" />

					{@render paddingSelect()}
					{@render cipherSelect()}
				</div>

				<Dialog.Footer class="flex flex-row! items-center justify-between! gap-1">
					<p class="text-end text-sm text-muted-foreground">This form saves automatically</p>

					<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
						Close
					</Dialog.Close>
					<!-- <Button type="submit">Save changes</Button> -->
				</Dialog.Footer>
			</Dialog.Content>
		</form>
	</Dialog.Root>
</div>
