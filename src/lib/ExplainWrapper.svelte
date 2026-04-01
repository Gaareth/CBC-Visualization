<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from './utils/styling';
	import ArrowNext from './icons/ArrowNext.svelte';
	import ArrowBack from './icons/ArrowBack.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		children?: Snippet;
		slides?: Snippet[];
		wrapperClass?: string;
		slideWrapperClass?: string;
		title?: string;
		next?: () => void;
		back?: () => void;
		onChangeSlide?: (index: number) => void;
	}

	let {
		children,
		slides = [],
		wrapperClass = '',
		slideWrapperClass = '',
		title,
		next,
		back,
		onChangeSlide
	}: Props = $props();

	let index = $state(0);

	const nextSlide = () => {
		if (index < slides.length - 1) {
			index++;
			onChangeSlide?.(index);
		} else {
			next?.();
		}
	};

	const previousSlide = () => {
		if (index > 0) {
			index--;
			onChangeSlide?.(index);
		} else {
			back?.();
		}
	};

	const navBtnClass = cn(`button-default color-level-1 rounded-full p-0.5`);
</script>

<div out:fade={{ duration: 150 }} in:fade={{ duration: 300 }} class="relative mx-auto">
	{#if index > 0 || back}
		<div class="abs-center-y right-full mx-2 flex-center">
			<button type="button" onclick={previousSlide} class={navBtnClass}>
				<ArrowBack />
			</button>
		</div>
	{/if}

	{#if title}
		<span class="absolute -top-1.5 left-4 z-10 px-1 text-xs font-medium dark:bg-surface-a10">
			{title}
		</span>
	{/if}

	<div
		class={cn(
			'relative flex h-[200px] max-w-7xl flex-col border-default bg-gray-50 p-5 pb-5 shadow-lg',
			'dark:border-surface-a30 dark:bg-surface-a10',
			wrapperClass
		)}
	>
		{#if slides.length > 0}
			<div class="relative w-full flex-1 overflow-hidden">
				<div
					class="flex h-full transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
					style="transform: translateX(-{index * 100}%);"
				>
					{#each slides as slide, i}
						<div class={cn('relative h-full w-full shrink-0', slideWrapperClass)}>
							{@render slide()}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="relative w-full flex-1">{@render children?.()}</div>
	</div>

	<div class="absolute top-0 right-0 flex gap-1 p-2">
		{#each { length: slides.length }, i}
			<div class={cn('rounded-full p-1', i == index ? 'color-level-3' : 'color-level-2')}></div>
		{/each}
	</div>

	{#if index < slides.length - 1 || next}
		<div class="abs-center-y left-full mx-2 flex-center">
			<button type="button" onclick={nextSlide} class={navBtnClass}>
				<ArrowNext />
			</button>
		</div>
	{/if}
</div>
