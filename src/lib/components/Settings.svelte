<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	// import { Settings } from 'lucide-svelte';
	import Settings from '@lucide/svelte/icons/settings';
</script>

<div class="fixed right-5 bottom-5">
	<Dialog.Root>
		<form>
			<Dialog.Trigger type="button" class={buttonVariants({ variant: 'outline' })}>
				<Settings />
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[625px]">
				<Dialog.Header>
					<Dialog.Title>Settings</Dialog.Title>
					<Dialog.Description>
						Make changes to the settings here. Click save when you are done.
					</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4"></div>
				<Dialog.Footer>
					<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
						Cancel
					</Dialog.Close>
					<Button type="submit">Save changes</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</form>
	</Dialog.Root>
</div>
