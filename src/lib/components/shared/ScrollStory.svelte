<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import Card from './Card.svelte';
	import {
		setSectionContext,
		type SectionContextValue,
		type SectionRegistration
	} from '../../contexts/scrollStoryContext';
	import { cn } from '../../utils/styling';

	interface Props {
		children?: () => any;
		titles?: string[];
	}

	let { children, titles }: Props = $props();

	let registrations: SectionRegistration[] = $state([]);
	let activeId = $state<string>();

	let ctxt: SectionContextValue = $state({
		shouldWrap: undefined,
		visualColumnWidth: undefined,
		activeId: undefined
	});

	$effect(() => {
		ctxt.activeId = activeId;
	});

	const register = (section: SectionRegistration) => {
		console.log('registering section:', section.id);
		registrations.push(section);
		if (!activeId) activeId = section.id;
	};

	setSectionContext({
		register,
		ctxt
	});

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				// Collect all currently visible sections
				const visible: { id: string; top: number }[] = [];

				for (const e of entries) {
					const id = e.target.getAttribute('data-section-id');
					if (!id) continue;

					if (e.isIntersecting) {
						visible.push({
							id,
							top: e.boundingClientRect.top
						});
					}
				}

				if (visible.length === 0) return;

				// Pick the section closest to the top of viewport
				visible.sort((a, b) => a.top - b.top);
				activeId = visible[0].id;
				console.log('active section:', activeId);
			},
			{
				// this creates a virtual "activation line"
				rootMargin: '-45% 0px -55% 0px',
				threshold: 0
			}
		);

		$effect(() => {
			registrations.forEach((s) => observer.observe(s.element));
		});

		return () => observer.disconnect();
	});

	let storyWrapperEl = $state<HTMLElement>();
	let contentEl = $state<HTMLElement>();
	// let visualWrapperEl = $state<HTMLElement>();
	let resizeObserver: ResizeObserver;

	function updateWidth() {
		if (!storyWrapperEl || !contentEl || !ctxt) return;
		ctxt.visualColumnWidth = storyWrapperEl.clientWidth - contentEl.clientWidth;
	}

	$effect(() => {
		if (!storyWrapperEl || !contentEl) return;
		resizeObserver = new ResizeObserver(updateWidth);
		resizeObserver.observe(storyWrapperEl);
		resizeObserver.observe(contentEl);

		updateWidth();
		return () => resizeObserver.disconnect();
	});
</script>

<div
	class="relative mx-auto my-10 grid max-w-[1400px] grid-cols-1 lg:grid-cols-2 gap-13 p-5"
	bind:this={storyWrapperEl}
>
	<aside class="static lg:absolute top-7 left-0 w-full lg:-translate-x-full lg:w-60 h-full">
		<div class="sticky top-7">
			<Card className="px-3 py-5" title="Contents" > 
				<!-- <p>Contents</p> -->
				<ol class="list-inside list-decimal space-y-3 text-sm">
					{#each titles as title (title)}
						<li>
							<a href={'#' + title} class:font-bold={title === activeId}>
								{title}
							</a>
						</li>
					{/each}
				</ol>
			</Card>
		</div>
	</aside>

	<article
		bind:this={contentEl}
		class={cn(
			'prose flex w-full flex-col lg:prose-lg dark:prose-invert',
			ctxt.shouldWrap ? 'col-span-2' : ''
		)}
	>
		{@render children?.()}
	</article>

	<!-- in:fade={{ duration: 200 }} out:fade={{ duration: 150 }} -->
	<!-- RIGHT COLUMN -->
	{#if !ctxt.shouldWrap}
		<div class="sticky top-10 h-fit hidden lg:block">
			{#key activeId}
				<div>
					{@render registrations.find((s) => s.id === activeId)?.visualSnippet?.()}
				</div>
			{/key}
		</div>
	{/if}
</div>
