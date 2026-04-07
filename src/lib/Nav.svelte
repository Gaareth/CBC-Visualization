<script>
	import { resolve } from '$app/paths';
	import { cn } from './utils/styling';

	let { className = '' } = $props();
</script>

<nav
	class={cn(
		'mx-4 flex justify-center gap-3 rounded-full border-default color-level-1 py-1',
		className
	)}
>
	<a href="/">Home</a>
	<a href={resolve('/encryption')}>Encryption</a>
	<a href={resolve('/decryption')}>Decryption</a>
	<a href={resolve('/padding-oracle-attack')}>Padding Oracle Attack</a>
</nav>

<style>
	nav {
		view-transition-name: nav-wrapper;
	}
</style>