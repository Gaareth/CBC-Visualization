<script>
	import { crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Welcome from './Welcome.svelte';
	import ExplainWrapper from './ExplainWrapper.svelte';
	import Test from './Test.svelte';
	import { receive, send } from './crossfade';
	import { tick } from 'svelte';
	import CBC from './CBC.svelte';
	import CBCEncryption from './CBCEncryption.svelte';

	let started = $state(false);
</script>

<div class="relative h-screen w-full">
	{#if !started}
		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
			in:receive={{ key: 'wrapper' }}
			out:send={{ key: 'wrapper' }}
		>
			<Welcome onstart={() => (started = true)} />
		</div>
	{:else}
		<!-- <Test bind:started/> -->

		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
			in:receive={{ key: 'wrapper' }}
			out:send={{ key: 'wrapper' }}
		>
			<CBCEncryption />
		</div>
	{/if}
</div>
