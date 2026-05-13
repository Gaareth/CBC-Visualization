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
	import { settingsState } from '$lib/stores/settings.svelte';

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

	$effect(() => {
		localStorage.setItem('settings', JSON.stringify(settingsState));
	});
</script>

<ModeWatcher />
<Toaster position="top-center" />
<Settings />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>CBC Padding Oracle Attack Demo</title>
</svelte:head>

<noscript>
	<div class="bg-dark p-4 text-center text-light">
		<p class="text-lg font-bold">JavaScript is highly recommended, as the main content here are interactive examples.</p>
		<p>You can read the raw explanations at <a href={resolve("/padding-oracle-attack/explain")} class="underline">/explain</a> although without JavaScript.</p>
	</div>
</noscript>

{#if showNav}
	<Nav className="mx-1 sm:mx-auto sm:w-3xl my-5" />
{/if}

<MobileWarning />

<main>{@render children()}</main>

<footer class="absolute -bottom-25 min-h-10 w-full bg-surface-1">
	<div class="flex-center gap-2 p-2">
		<p>Made by <a href="https://gaareth.com" class="hover:underline">Gaareth</a></p>
		<p>|</p>
		<p>
			Open Sourced at <a href="https://github.com/Gaareth/CBC-Visualization" class="hover:underline"
				>Github</a
			>
		</p>
	</div>
</footer>
