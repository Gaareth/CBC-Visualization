<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/Nav.svelte';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import Settings from '$lib/components/Settings.svelte';
	import MobileWarning from '$lib/components/MobileWarning.svelte';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const showNav = $derived(page.url.pathname !== resolve('/'));

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<ModeWatcher />
<Toaster position="top-center" />
<Settings />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>CBC Padding Oracle Attack Demo</title>
</svelte:head>

{#if showNav}
	<Nav className="mx-1 sm:mx-auto sm:w-3xl my-5" />
{/if}

<MobileWarning />

<main>{@render children()}</main>

<footer class="absolute -bottom-25 min-h-10 w-full bg-surface-1">
	<div class="flex-center p-2 gap-2">
		<p>Made by <a href="https://gaareth.com" class="hover:underline">Gaareth</a></p>
		<p>|</p>
		<p>
			Open Sourced at <a href="https://github.com/Gaareth/CBC-Visualization" class="hover:underline">Github</a>
		</p>
	</div>
</footer>
