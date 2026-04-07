<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from './utils/styling';

	interface Props {
		className?: string;
		surfaceLevel?: number;
		children?: Snippet;
		title?: string;
	}

	let { className = '', surfaceLevel = 1, children, title }: Props = $props();

	const surfaceTransitions = {
		0: 'bg-transparent',
		1: 'dark:to-surface-a10 to-gray-50',
		2: 'dark:to-surface-a20 to-gray-100',
		3: 'dark:to-surface-a30 to-gray-200',
		4: 'dark:to-surface-a40 to-white'
	} as const;

	const surfaces = {
		0: 'bg-transparent border-none shadow-none',
		1: 'bg-gray-50 border-default shadow-lg dark:bg-surface-a10 dark:border-surface-a20',
		2: 'bg-gray-100 border-default shadow-xl dark:bg-surface-a20 dark:border-surface-a30',
		3: 'bg-gray-200 border-default shadow-2xl dark:bg-surface-a30 dark:border-surface-a40',
		4: 'bg-white border-default shadow-2xl dark:bg-surface-a40 dark:border-surface-a50'
	} as const;

	let surfaceClass = $derived(surfaces[surfaceLevel as keyof typeof surfaces] ?? surfaces[1]);
</script>

<div class={cn('relative border p-5', surfaceClass, className)}>
	{#if title}
		<span
			class={cn(
				'absolute -top-2 left-4 z-10 bg-linear-to-b from-45% to-5% px-1 text-xs font-medium',
				'from-transparent',
				surfaceTransitions[surfaceLevel as keyof typeof surfaceTransitions] ?? surfaceTransitions[1]
			)}
		>
			{title}
		</span>
	{/if}

	{@render children?.()}
</div>
