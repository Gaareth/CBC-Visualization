<script lang="ts">
	import { goto } from '$app/navigation';
	import { receive, send } from '$lib/crossfade';
	import Welcome from '$lib/Welcome.svelte';
</script>

<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform" 	in:receive={{ key: 'wrapper' }}
	out:receive={{ key: 'wrapper' }}>
	<Welcome onstart={() => goto('/encryption')} />
</div>
