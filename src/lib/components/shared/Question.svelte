<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import Card from './Card.svelte';
	import { cn } from '../../utils/styling';
	import { fade } from 'svelte/transition';
	import Divider from './Divider.svelte';

	interface Props {
		id: string;
		question: Snippet;
		reveal: Snippet;
		className?: string;
		title?: string;
	}

	let { question, reveal, id, className, title }: Props = $props();

	let showReveal = $state(false);
	onMount(() => {
		const revealed = localStorage.getItem(`question-${id}-revealed`);
		if (revealed === 'true') {
			showReveal = true;
		}
	});

	function revealAnswer() {
		showReveal = true;
		localStorage.setItem(`question-${id}-revealed`, 'true');
	}
</script>

<Card title={"Question" + (title ? `: ${title}` : '')} className={cn('flex flex-col', className)}>
	{@render question()}

	<Divider className="my-4" surfaceLevel={1} />

	{#if showReveal}
		<div in:fade>
			{@render reveal()}
		</div>
	{:else}
		<button class={cn('px-4 py-2 transition')} onclick={revealAnswer}> Reveal answer </button>
	{/if}
</Card>
