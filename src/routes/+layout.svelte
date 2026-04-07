<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/Nav.svelte';
	import { page } from '$app/state';
	import { receive, send } from '$lib/crossfade';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	const showNav = $derived(page.url.pathname !== '/');

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

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if showNav}
		<Nav className="mx-auto w-3xl my-5"/>
{/if}

{@render children()}
