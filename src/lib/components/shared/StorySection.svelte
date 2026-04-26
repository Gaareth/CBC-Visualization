<script lang="ts">
	import { onMount } from 'svelte';
	import { getSectionContext } from '../../contexts/scrollStoryContext';
	import { cn } from '$lib/utils';

	type Snippet = () => any;

	interface Props {
		title: string;
		headingLevel?: number;
		children?: Snippet;
		visualSnippet: Snippet;
	}

	let { title, headingLevel = 2, children, visualSnippet }: Props = $props();

	let sectionEl: HTMLElement;
	const ctxt = getSectionContext();
	onMount(() => {
		if (ctxt.register && sectionEl) {
			ctxt.register({ id: title, element: sectionEl, visualSnippet });
		}
	});

	$effect(() => {
		if (ctxt.ctxt?.activeId === title) {
			// console.log('i became active section:', title);
			ctxt.ctxt.shouldWrap = false;
		}
	});
</script>

<section bind:this={sectionEl} data-section-id={title}>
	<svelte:element
		this={'h' + headingLevel}
		id={title}
		class={cn(ctxt.ctxt?.activeId === title ? 'underline' : '')}
	>
		{title}
	</svelte:element>

	{@render children?.()}

	<!-- TODO: add individual shouldwrap -->
	<div
		style:width={(sectionEl?.clientWidth ?? 0) * 2 + 'px'}
		class={cn(
			'not-prose my-5 flex-center not-lg:w-full!',
			!ctxt.ctxt?.shouldWrap ? 'lg:hidden' : ''
		)}
	>
		{@render visualSnippet?.()}
	</div>
</section>
