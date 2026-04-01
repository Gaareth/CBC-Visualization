<script lang="ts">
	import { cn } from './utils/styling';

	interface Props {
		value: string;
		label: string;
		type?: string;
		name?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		hint?: string;
		wrapperClass?: string;
		className?: string;
		oninput?: (event: Event) => void;
	}

	/** @type {import('svelte').Snippet | undefined} */
	let {
		value = $bindable(''),
		label = 'Label',
		type = 'text',
		name = '',
		id = crypto.randomUUID().slice(0, 8),
		required = false,
		disabled = false,
		error = '',
		hint = '',
		wrapperClass = '',
		className = '',
		oninput = () => {}
	}: Props = $props();

	let focused = $state(false);

	// Label floats when the field is focused OR has a value
	let floated = $derived(focused || value.length > 0);
</script>

<div class={cn('group relative', wrapperClass)}>
	<input
		{id}
		{name}
		{type}
		{required}
		{disabled}
		oninput={oninput}
		bind:value
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
		placeholder=""
		aria-invalid={!!error}
		aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
		class={cn(
			`peer
            w-full input-default border bg-transparent px-4 pt-5 pb-2 text-base
            outline-none
            placeholder-shown:pt-3.5
            placeholder-shown:pb-3.5
            disabled:cursor-not-allowed
            disabled:opacity-50`,
			error && 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
			className
		)}
	/>

	<!-- ── floating label ───────────────────────────────────── -->
	<label
		for={id}
		class="
      pointer-events-none absolute left-4 origin-left
      transition-all duration-200 ease-out

      {floated ? 'top-1.5 text-xs font-medium' : 'top-1/2 -translate-y-1/2 text-base font-normal'}

      {error ? 'text-red-500' : ''}"
	>
		{label}{#if required}<span class="ml-0.5 text-error">*</span>{/if}
	</label>

	{#if error}
		<p id="{id}-error" class="mt-1.5 text-xs text-error">{error}</p>
	{:else if hint}
		<p id="{id}-hint" class="mt-1.5 text-xs text-secondary">{hint}</p>
	{/if}
</div>
