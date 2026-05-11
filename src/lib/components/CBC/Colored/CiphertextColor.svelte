<script lang="ts">
	import { cn } from '$lib/utils';
	import { BLOCK_COLORS } from '$lib/utils/styling';
	import type { Snippet } from 'svelte';

	interface Props {
		className?: string;
		children: Snippet;
	}
	const { children, className, ...rest }: Props = $props();
</script>

<span class={cn(`text-${BLOCK_COLORS.ciphertext}`, className)} {...rest}>
	{@render children()}
</span>
