<script>
	import { cn } from './utils/styling';

	let { text, className } = $props();
</script>

<div class={cn('flex flex-row items-center gap-2', className)}>
	<div class="line"></div>
	{text}
	<div class="line"></div>
</div>

<style>
	.line {
		flex: 1;
		border-bottom: 1px solid var(--color-surface-a20);
	}
</style>
