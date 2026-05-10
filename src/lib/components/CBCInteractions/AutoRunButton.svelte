<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { cn } from 'tailwind-variants';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { inputLayer, type SurfaceLevel } from '$lib/utils/styling';
	import { autoRunGate, type Gate } from '$lib/utils/generic';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import Separator from '../ui/separator/separator.svelte';

	interface Props {
		surfaceLevel?: SurfaceLevel;

		blockGate: Gate;
		byteGate: Gate;
		interactionGate: Gate;

		isEnabled?: boolean;
		isToggleable?: boolean;
		guessSpeedSettings?: {
			type: 'exponential' | 'constant';
			constantDelayValue: number;
			exponentialDelayDenominator: number;
		};
	}

	let {
		surfaceLevel = 1,
		blockGate,
		byteGate,
		interactionGate,
		isEnabled = $bindable(false),
		isToggleable = true,
		guessSpeedSettings = $bindable({
			type: 'exponential',
			constantDelayValue: 100,
			exponentialDelayDenominator: 5
		})
	}: Props = $props();

	let dropdownOpen = $state(false);
	const autoRunMaxDelay = 5000;

	let autoRunState = $state({
		delay: 100,
		stopBlockAutoRun: () => {},
		stopByteAutoRun: () => {},
		stopInteractionAutoRun: () => {}
	});

	function autoRunToggle() {
		if (!isToggleable) return;

		if (isEnabled) {
			autoRunState.stopBlockAutoRun();
			autoRunState.stopByteAutoRun();
			autoRunState.stopInteractionAutoRun();
			isEnabled = false;
		} else {
			isEnabled = true;
			autoRunState = {
				delay: autoRunState.delay,
				stopBlockAutoRun: autoRunGate(blockGate, () => autoRunState.delay),
				stopByteAutoRun: autoRunGate(byteGate, () => autoRunState.delay),
				stopInteractionAutoRun: autoRunGate(interactionGate, () => autoRunState.delay)
			};
		}
	}

	function setConstant(value: number | undefined = undefined) {
		guessSpeedSettings.type = 'constant';
		if (value !== undefined) {
			guessSpeedSettings.constantDelayValue = value;
		}
	}

	function setExponential() {
		guessSpeedSettings.type = 'exponential';
	}
</script>

{#snippet TriggerButton()}
	<button
		type="button"
		class={cn(
			'button-default border-r-0!',
			isEnabled ? inputLayer[(surfaceLevel + 1) as SurfaceLevel] : inputLayer[surfaceLevel]
		)}
		onclick={autoRunToggle}
		disabled={!isToggleable}
	>
		{#if isEnabled}
			Stop Auto-Run
		{:else}
			Auto-Run
		{/if}
	</button>
{/snippet}

{#snippet SettingsButton()}
	<DropdownMenu.Root bind:open={dropdownOpen}>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					class={cn(
						'button-default px-2',
						inputLayer[surfaceLevel],
						dropdownOpen ? inputLayer[(surfaceLevel + 1) as SurfaceLevel] : ''
					)}
				>
					<ChevronDown />
				</button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-auto min-w-64">
			<DropdownMenu.Group>
				<DropdownMenu.Label>Auto-Run Settings</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					<ButtonGroup.Root class="my-4 flex-center w-full">
						<button
							class={cn('button-default border-r-0!', inputLayer[2])}
							onclick={() => (autoRunState.delay = 0)}>Instant</button
						>
						<button
							class={cn('button-default border-r-0!', inputLayer[2])}
							onclick={() => (autoRunState.delay = 1000)}>Medium</button
						>
						<button
							class={cn('button-default', inputLayer[2])}
							onclick={() => (autoRunState.delay = 5000)}>Slow</button
						>
					</ButtonGroup.Root>
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					<div class="my-4 flex w-full flex-col gap-2">
						<label for="delay">Delay ({autoRunState.delay} ms)</label>
						<Slider
							id="delay"
							type="single"
							bind:value={autoRunState.delay}
							max={autoRunMaxDelay}
							min={0}
							step={1}
							class="w-full"
						/>
					</div>
				</DropdownMenu.Item>

				<Separator class="my-2" />

				<div class="flex flex-col gap-4 px-1.5">
					<h2 class="text-center">Guess Speed</h2>

					<ButtonGroup.Root class="mb-4">
						<button
							class={cn(
								'button-default border-r-0!',
								guessSpeedSettings.type === 'constant' &&
									guessSpeedSettings.constantDelayValue === 0
									? inputLayer[3]
									: inputLayer[2]
							)}
							onclick={() => setConstant(0)}>Instant</button
						>
						<button
							class={cn(
								'button-default border-r-0!',
								guessSpeedSettings.type === 'exponential' ? inputLayer[3] : inputLayer[2]
							)}
							onclick={setExponential}
						>
							Exponential
						</button>
						<button
							class={cn(
								'button-default',
								guessSpeedSettings.type === 'constant' &&
									guessSpeedSettings.constantDelayValue !== 0
									? inputLayer[3]
									: inputLayer[2]
							)}
							onclick={() => setConstant()}
						>
							Constant
						</button>
					</ButtonGroup.Root>

					{@render ConstantSlider()}

					{#if guessSpeedSettings.type === 'exponential'}
						{@render ExponentialSlider()}
					{/if}
				</div>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<ButtonGroup.Root>
	{@render TriggerButton()}
	{@render SettingsButton()}
</ButtonGroup.Root>

{#snippet ConstantSlider()}
	<label for="consDelay">Constant Delay ({guessSpeedSettings.constantDelayValue} ms)</label>
	<Slider
		id="consDelay"
		type="single"
		bind:value={guessSpeedSettings.constantDelayValue}
		max={autoRunMaxDelay}
		min={0}
		step={1}
		class="w-full"
	/>
{/snippet}

{#snippet ExponentialSlider()}
	<label for="expDelay"
		>Exponential smoothing Factor ({guessSpeedSettings.exponentialDelayDenominator})</label
	>
	<Slider
		id="expDelay"
		type="single"
		bind:value={guessSpeedSettings.exponentialDelayDenominator}
		max={15}
		min={0}
		step={1}
		class="w-full"
	/>
{/snippet}
