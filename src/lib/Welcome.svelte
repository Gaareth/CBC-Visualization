<script>
	import { typewriter } from './actions/typewriter';
	import ExplainWrapper from './components/shared/ExplainWrapper.svelte';
	import Nav from './Nav.svelte';
	import { receive, send } from './crossfade';
	let { onstart } = $props();
</script>

<ExplainWrapper wrapperClass="w-3xl h-[375px]">
	<div class="mb-7">
		<Nav surfaceLevel={2} />
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
		<p class="text-muted-foreground motion-safe:fadeInRight-animation">
			You will find short interactive examples, visualizing CBC, and a longer interactive
			explanation and tool to demonstrate the padding oracle attack.

			<br />
			You can skip directly to the parts relevant for you, or you can take the tour:
		</p>

		<div class="mt-4 flex-center h-full">
			<button
				class="button-default border-2 border-primary-0! bg-surface-1 text-xl hover:bg-surface-2!"
				onclick={onstart}
			>
				Lets go!
			</button>
		</div>
	</div>
</ExplainWrapper>
