<!-- Spoiler.svelte -->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { bgSurface, cn, hoverBgSurface, type SurfaceLevel } from '../../utils/styling';
	import { fnv1a_hash } from '../../utils/compute';

	interface Props {
		label?: string;
		revealed?: boolean;
		children: Snippet;
		surfaceLevel?: SurfaceLevel;
		remember?: boolean;
	}

	let {
		label = 'Spoiler',
		revealed = $bindable(false),
		children,
		surfaceLevel = 1,
		remember = false
	}: Props = $props();

	let contentEl: HTMLSpanElement;
	let hash = $state<string>('');

	const STORAGE_PREFIX = 'spoiler:';

	onMount(() => {
		const text = contentEl.textContent ?? '';
		hash = fnv1a_hash(text);

		if (remember) {
			try {
				if (localStorage.getItem(STORAGE_PREFIX + hash) === '1') {
					revealed = true;
				}
			} catch {
				console.warn(
					'Local storage is not available; spoiler reveal state will not be remembered.'
				);
			}
		}
	});

	function toggle() {
		revealed = !revealed;
		if (remember && hash) {
			try {
				if (revealed) {
					localStorage.setItem(STORAGE_PREFIX + hash, '1');
				} else {
					localStorage.removeItem(STORAGE_PREFIX + hash);
				}
			} catch {
				console.warn(
					'Local storage is not available; spoiler reveal state will not be remembered.'
				);
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		}
	}
</script>

<button
	type="button"
	class={'spoiler'}
	class:revealed
	aria-expanded={revealed}
	aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
	onclick={toggle}
	onkeydown={handleKeydown}
>
	<span
		class={cn(
			'content',
			'not-dark:bg-gray-200 not-dark:hover:bg-gray-300',
			hoverBgSurface[(surfaceLevel + 1) as SurfaceLevel],
			bgSurface[surfaceLevel]
		)}
		aria-hidden={!revealed}
		bind:this={contentEl}
	>
		{@render children()}
	</span>
</button>

<style>
	.spoiler {
		display: inline;
		padding: 0;
		margin: 0;
		border: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
		border-radius: 0.2em;
	}

	.content {
		color: transparent;
		border-radius: 0.2em;
		padding: 0 0.2em;
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
		user-select: none;
	}

	.spoiler.revealed .content {
		/* background-color: color-mix(in srgb, currentColor 10%, transparent); */
		background-color: transparent;
		color: inherit;
		user-select: text;
	}

	.spoiler:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.content {
			transition: none;
		}
	}
</style>
