<script lang="ts">
	import { onMount } from 'svelte';
	let showMobileWarning = $state(true);
	import XIcon from '@lucide/svelte/icons/x';

	function closeOverlay() {
		showMobileWarning = false;
	}
	onMount(() => {
		// Only runs in the browser
		function handleKey(e: KeyboardEvent) {
			if (e.key === 'Escape') closeOverlay();
		}

		window.addEventListener('keydown', handleKey);

		return () => {
			window.removeEventListener('keydown', handleKey);
		};
	});
</script>

{#if showMobileWarning}
	<div class="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 p-4 md:hidden">
		<div class="relative rounded-lg bg-surface-a20 p-6 text-center">
			<button
				onclick={closeOverlay}
				class="absolute top-2 right-2 text-lg font-bold text-white"
				aria-label="Close"
			>
				<XIcon />
			</button>
			<h2 class="mb-2 text-xl font-bold">Mobile Not Supported</h2>
			<p class="text-sm">
				Sorry this website is not really usable on smaller devices. Its possible this changes in the
				future.
			</p>
		</div>
	</div>
{/if}
