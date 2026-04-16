<script lang="ts">
	import { borderLayer, cn, type BgSurfaceLevel, type SurfaceLevel } from '../../utils/styling';

	interface Props {
		text?: string;
		className?: string;
		children?: () => any;
		hideText?: boolean;
		surfaceLevel?: BgSurfaceLevel; // surface level of the background the divider is on
	}

	let { text, className, children, hideText, surfaceLevel = 0 }: Props = $props();
</script>

<div class={cn('flex flex-row items-center gap-2', className, (hideText || (!text && !children)) && 'gap-0')}>
	<div class={cn('flex-1 border-s-0! border-l-0! border-r-0!', borderLayer[surfaceLevel])}></div>
	{#if !hideText}
		{#if children}
			{@render children?.()}
		{:else}
			{text}
		{/if}
	{/if}
	<div class={cn('flex-1 border-s-0! border-l-0! border-r-0!', borderLayer[surfaceLevel])}></div>
</div>
