<script lang="ts">
	import { onMount } from 'svelte';
	import { getSectionContext } from './contexts/scrollStoryContext';

	type Snippet = () => any;

	interface Props {
		id: string;
		children?: Snippet;
		visualSnippet: Snippet;
	}

	let { id, children, visualSnippet }: Props = $props();

	let sectionEl: HTMLElement;
	const ctxt = getSectionContext();
	onMount(() => {
		if (ctxt.register && sectionEl) {
			ctxt.register({ id, element: sectionEl, visualSnippet });
		}
	});

	$effect(() => {
		if (ctxt.ctxt?.activeId === id) {
			console.log('i became active section:', id);
			ctxt.ctxt.shouldWrap = false;
		}
	});
</script>

<section bind:this={sectionEl} data-section-id={id}>
	{@render children?.()}
	<!-- TODO: add individual shouldwrap -->
	{#if ctxt.ctxt?.shouldWrap}
		<div class="not-prose my-5 flex-center w-5xl">
			{@render visualSnippet?.()}
		</div>
	{/if}
</section>
