<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/Nav.svelte';
	import { page } from '$app/state'; 
	import { receive, send } from '$lib/crossfade';

	let { children } = $props();

	const showNav = $derived(page.url.pathname !== '/');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if showNav}
	<div class="mx-auto w-3xl py-5" in:receive={{ key: 'nav' }} out:send={{ key: 'nav' }}>
		<Nav />
	</div>
{/if}

{@render children()}
