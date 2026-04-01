<script>
	import { crossfade } from 'svelte/transition';
	import ExplainWrapper from './ExplainWrapper.svelte';
	import { quintOut } from 'svelte/easing';
	import { receive, send } from './crossfade';
	import { tick } from 'svelte';

	let { started = $bindable() } = $props();
</script>

<!-- <div
	class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
	in:receive={{ key: 'wrapper' }}
	out:send={{ key: 'wrapper' }}
> -->
<ExplainWrapper wrapperClass="w-[800px] h-[400px]">
	<div class="flex flex-col gap-2 leading-relaxed">
		<p class="text-2xl">CBC Demo Started!</p>
		<!-- Insert your CBC component here -->
		<button
			class="mt-4 button-default"
			onclick={async () => {
				await tick();
				started = false;
			}}>Reset</button
		>
	</div>
</ExplainWrapper>
<!-- </div> -->
