<script lang="ts">
	import { cn } from '../../utils/styling';

	interface Props {
		text?: string;
		className?: string;
		children?: () => any;
		hideText?: boolean;
	}

	let { text, className, children, hideText }: Props = $props();
</script>

<div class={cn('flex flex-row items-center gap-2', className, hideText && 'gap-0')}>
	<div class="line"></div>
	{#if !hideText}
		{#if children}
			{@render children?.()}
		{:else}
			{text}
		{/if}
	{/if}
	<div class="line"></div>
</div>

<style>
	.line {
		flex: 1;
		border-bottom: 1px solid var(--color-surface-a20);
	}
</style>
