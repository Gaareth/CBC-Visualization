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
	<div class="dropdown">
		<button
			type="button"
			class={cn('rounded-full px-4 py-1', SURFACE_LEVEL_BG_COLORS_ONLY_HOVER[surfaceLevel + 1])}
		>
			{title}
		</button>
		<!-- dropdown panel is inside same group -->
		<div class="dropdown-content">
			<div
				class="flex flex-col rounded border bg-surface-a20/50 p-4 py-4
			shadow-lg backdrop-blur-md"
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
	</div>
{/snippet}

<nav
	class={cn(
		'mx-4 flex justify-center gap-1 rounded-full border py-1 sm:gap-3',
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

	.dropdown {
		position: relative;
		z-index: 9999;
	}

	.dropdown:hover .dropdown-content {
		display: block;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		/* top: 0; */
		/* transform: translateY(40%); */
		transform: translateX(-50%);
		left: 50%;
		min-width: 200px;
		padding: 12px 16px;
		z-index: 9999;
	}
</style>
