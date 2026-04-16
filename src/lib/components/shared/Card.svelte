<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		cn,
		surfaceOutline
	} from '../../utils/styling';

	interface Props {
		className?: string;
		surfaceLevel?: number;
		children?: Snippet;
		title?: string;
		titleClassName?: string;
	}

	let { className = '', surfaceLevel = 1, children, title, titleClassName }: Props = $props();

	const surfaceTransitions = {
		0: 'bg-transparent',
		1: 'to-surface-1',
		2: 'to-surface-2 ',
		3: 'to-surface-3 ',
		4: 'to-surface-4 '
	} as const;

</script>

<div class={cn('relative border p-5 drop-shadow-sm', 
	surfaceTransitions[surfaceLevel as keyof typeof surfaceTransitions], 
	surfaceOutline[surfaceLevel as keyof typeof surfaceOutline], className)}>
	{#if title}
		<span
			class={cn(
				'absolute -top-2 left-4 z-10 bg-linear-to-b from-45% to-5% px-1 text-xs font-medium',
				'from-transparent',
				surfaceTransitions[surfaceLevel as keyof typeof surfaceTransitions] ??
					surfaceTransitions[1],
				titleClassName
			)}
		>
			{title}
		</span>
	{/if}

	{@render children?.()}
</div>
