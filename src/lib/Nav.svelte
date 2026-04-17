<script lang="ts">
	import { resolve } from '$app/paths';
	import { cn, hoverBgSurface, surfaceOutline, type SurfaceLevel } from './utils/styling';

	let { className = '', surfaceLevel = 1 }: { className?: string; surfaceLevel?: SurfaceLevel } =
		$props();
</script>

{#snippet dropdownNav(title: string, items: { label: string; href: string }[])}
	<div class="dropdown">
		<button
			type="button"
			class={cn(
				'rounded-full px-4 py-1 ',
				hoverBgSurface[(surfaceLevel + 1) as keyof typeof hoverBgSurface]
			)}
		>
			{title}
		</button>
		<!-- dropdown panel is inside same group -->
		<div class="dropdown-content">
			<div
				class="flex flex-col rounded border bg-surface-2 p-4 py-4 shadow-lg
			backdrop-blur-md dark:bg-surface-2/50"
			>
				{#each items as item (item.href)}
					<a
						href={item.href}
						class={cn('rounded px-4 py-2 text-left', 'whitespace-nowrap hover:bg-surface-3')}
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
		surfaceOutline[surfaceLevel],
		className
	)}
>
	<a
		href={resolve('/')}
		class={cn(
			'rounded-full px-4 py-1 ',
			hoverBgSurface[(surfaceLevel + 1) as keyof typeof hoverBgSurface]
		)}
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
		position: relative;
		z-index: 10;
	}

	.dropdown {
		position: relative;
	}

	.dropdown:hover .dropdown-content,
	.dropdown:focus-within .dropdown-content {
		display: block;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		/* top: 0; */
		/* transform: translateY(40%); */
		transform: translateX(-50%);
		top: 100%;
		left: 50%;
		min-width: 200px;
		padding: 12px 16px;
		/* z-index: 0; */
	}
</style>
