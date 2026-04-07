<script>
	import { crossfade } from 'svelte/transition';
	import ExplainWrapper from './ExplainWrapper.svelte';
	import { quintOut } from 'svelte/easing';
	import { receive, send } from './crossfade';
	import { tick } from 'svelte';
	import Block from './Block.svelte';

	let { started = $bindable() } = $props();

	let blocks = $state([
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0]
	]);
	let c = $state(0);
</script>

<button
	class="button-default"
	onclick={() => {
		blocks[0][c] = blocks[0][c] + 1;
		c = (c + 1) % 8;
	}}
>
	click
</button>

<Block bytes={blocks[0]} />
<Block bytes={blocks[1]} />
