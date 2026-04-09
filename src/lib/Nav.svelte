<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		cn,
		SURFACE_LEVEL_BG_COLORS,
		SURFACE_LEVEL_BG_COLORS_NO_HOVER,
		SURFACE_LEVEL_BG_COLORS_ONLY_HOVER,
		SURFACE_LEVEL_BORDER_COLORS,
		SURFACE_LEVEL_BORDER_COLORS_NO_HOVER
	} from './utils/styling';

	let { className = '', surfaceLevel = 1 } = $props();
</script>

{#snippet dropdownNav(title: string, items: { label: string; href: string }[])}
	<div class="group relative flex-center">
		<button
			type="button"
			class={cn('rounded-full px-4 py-1', SURFACE_LEVEL_BG_COLORS_ONLY_HOVER[surfaceLevel + 1])}
		>
			{title}
		</button>
		<!-- dropdown panel is inside same group -->
		<div
			class="invisible absolute top-full left-0 z-100 mt-2 flex w-fit flex-col rounded
			border bg-surface-a20/70 p-4 opacity-0 shadow-lg backdrop-blur-md transition-all duration-150 group-hover:visible
				group-hover:opacity-100
			"
		>
			{#each items as item (item.href)}
				<a
					href={item.href}
					class={cn(
						'rounded px-4 py-2 text-left',
						'whitespace-nowrap',
						SURFACE_LEVEL_BG_COLORS_ONLY_HOVER[surfaceLevel + 2]
					)}
				>
					{item.label}
				</a>
			{/each}
		</div>
	</div>
{/snippet}

<nav
	class={cn(
		'mx-4 flex justify-center gap-3 rounded-full border py-1',
		SURFACE_LEVEL_BG_COLORS_NO_HOVER[surfaceLevel],
		SURFACE_LEVEL_BORDER_COLORS_NO_HOVER[surfaceLevel],
		className
	)}
>
	<a
		href={resolve('/')}
		class={cn('rounded-full px-4 py-1', SURFACE_LEVEL_BG_COLORS_ONLY_HOVER[surfaceLevel + 1])}
	>
		Home
	</a>

	{@render dropdownNav('CBC', [
		{ label: 'Encryption', href: resolve('/encryption') },
		{ label: 'Decryption', href: resolve('/decryption') }
	])}

	{@render dropdownNav('Padding Oracle', [
		{ label: 'Interactively Explained', href: resolve('/padding-oracle-attack/explain') },
		{ label: 'Tool', href: resolve('/padding-oracle-attack') }
	])}
</nav>

<style>
	nav {
		view-transition-name: nav-wrapper;
	}
</style>
