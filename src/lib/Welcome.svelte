<script>
	import { fade } from 'svelte/transition';
	import { typewriter } from './actions/typewriter';
	import ExplainWrapper from './ExplainWrapper.svelte';
	import Nav from './Nav.svelte';
	import { receive, send } from './crossfade';
	let { onstart } = $props();
</script>

<ExplainWrapper wrapperClass="w-3xl h-[300px]" >
	<div class="mb-7" in:receive={{ key: 'nav' }} out:send={{ key: 'nav' }}>
		<Nav className="color-level-2"/>
	</div>

	<div class="flex h-full flex-col gap-2 leading-relaxed">
		<p
			class="invisible text-5xl motion-safe:fadeInRight-animation"
			use:typewriter={{ typingDelay: 75 }}
		>
			Welcome
		</p>
		<p class="text-xl motion-safe:fadeInRight-animation">
			to this Chained Block Cipher (CBC) demo + padding oracle visualization.
		</p>

		<div class="flex-center h-full">
			<button
				class="button-default border-2 border-primary-a0 text-xl hover:dark:bg-surface-a20"
				onclick={onstart}
			>
				Lets go!
			</button>
		</div>
	</div>
</ExplainWrapper>
