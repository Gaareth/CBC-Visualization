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
		settingsState
	} from '$lib/stores/settings.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import NumberInput from './ui/NumberInput.svelte';
	import { CBC_LAYOUT } from '$lib/stores/cbcConstants.svelte';

	let isDarkMode = $state(mode.current === 'dark');
</script>

{#snippet hexSelect()}
	<Label for="byteDisplay">Byte display format</Label>
	<Select.Root type="single" bind:value={settingsState.displayBytesAs}>
		<Select.Trigger class="w-[180px]" id="byteDisplay">
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
		<Select.Trigger class="w-[180px]" id="paddingScheme">
			{settingsState.paddingScheme}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Padding</Select.Label>
				{#each PADDING_SCHEMES as format (format)}
					<Select.Item value={format} label={format}>
						{format}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
{/snippet}

{#snippet cipherSelect()}
	<Label for="blockCipher">Block cipher function</Label>
	<Select.Root type="single" bind:value={settingsState.blockCipher}>
		<Select.Trigger class="w-[180px]" id="blockCipher">
			{settingsState.blockCipher}
		</Select.Trigger>
		<Select.Content>
			<Select.Group>
				<Select.Label>Block Cipher</Select.Label>
				{#each BLOCK_CIPHERS as format (format)}
					<Select.Item value={format} label={format}>
						{format}
					</Select.Item>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
{/snippet}

<div class="fixed right-5 bottom-5">
	<Dialog.Root>
		<form>
			<Dialog.Trigger
				type="button"
				class={buttonVariants({ variant: 'outline', class: 'rounded-full' })}
			>
				<Settings />
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Settings</Dialog.Title>
					<Dialog.Description>
						Make changes to the settings here. Auto saves.
					</Dialog.Description>
				</Dialog.Header>
				<!-- <hr class="bg-surface-a30" /> -->

				<div class="my-4 grid grid-cols-2 gap-4 gap-y-5">
					<Label for="darkMode">Dark mode</Label>
					<Switch id="darkMode" onclick={toggleMode} checked={isDarkMode} />

					<hr class="col-span-2 my-2" />

					<Label for="highlightChanges">Highlight changes</Label>
					<Switch id="highlightChanges" bind:checked={settingsState.highlightChanges} />

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

				<Dialog.Footer class="flex items-center justify-between! gap-1">
					<p class="text-end text-sm text-secondary">This form saves automatically</p>

					<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
						Close
					</Dialog.Close>
					<!-- <Button type="submit">Save changes</Button> -->
				</Dialog.Footer>
			</Dialog.Content>
		</form>
	</Dialog.Root>
</div>
