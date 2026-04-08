<script module>
	const blockSize = 8;
	const arrowWidth = 75;
	const arrowThickness = 3;
	const arrowHeadWidth = 15;

	const byteWidth = 10 * 4;
	const byteHeight = 32;
	const blockWidth = blockSize * byteWidth;
	const gap = 6;

	const gapToNext = blockWidth / 5;
	const toMidLength = blockWidth / 2 + gapToNext / 2;
	const xorDiameter = 20;
	const functionHeight = 40;

	// prettier-ignore
	//                  from middle arrow      fn
	const toXorLength = arrowWidth / 2 + gap + functionHeight + gap + arrowWidth + gap 
	// half of line    				half of xor   				 half of line
	+ arrowThickness/2          + xorDiameter/2 			+ arrowThickness/2

	const ivWidth = blockWidth;
	const leftSize = ivWidth + gap + arrowWidth + gap + xorDiameter / 2;
	const leftPadding = leftSize - blockWidth / 2;

	export const STYLE_CONSTANTS = {
		blockSize,
		arrowWidth,
		arrowThickness,
		byteWidth,
		byteHeight,
		blockWidth,
		gap,
		gapToNext,
		toMidLength,
		xorDiameter,
		functionHeight,
		toXorLength,
		leftPadding
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import Arrow from '../shared/Arrow.svelte';
	import Block from '../shared/Block.svelte';
	import { cn } from '../../utils/styling';
	import type { Snippet } from 'svelte';
	import type { Padder } from '../../logic/padding';

	interface CBCBlockProps {
		index: number;
		plaintextBlock: (number | undefined)[];
		ciphertextBlock: (number | undefined)[];
		initializationVector?: (number | undefined)[];
		isLastBlock?: boolean;
		encryptionMode?: boolean;
		targetRotation?: number;

		addInitPadding?: boolean; // whether to add extra padding space on the left for the IV and its arrow

		padder?: Padder;

		onChangePlaintext?: (bytes: (number | undefined)[]) => void;
		onChangeCiphertext?: (bytes: (number | undefined)[]) => void;
		onChangeIV?: (bytes: (number | undefined)[]) => void;

		PlainTextBlock?: Snippet<[index: number]>;
		IVBlock?: Snippet<[index: number]>;
		FnOutputBlock?: Snippet<[index: number]>;
		VerticalBar?: Snippet;
	}

	let {
		index,
		plaintextBlock,
		ciphertextBlock,
		initializationVector,
		isLastBlock,
		encryptionMode = true,
		targetRotation = encryptionMode ? 90 : 270,
		padder,
		addInitPadding = false,

		onChangePlaintext,
		onChangeCiphertext,
		onChangeIV,

		PlainTextBlock,
		IVBlock,
		FnOutputBlock,
		VerticalBar
	}: CBCBlockProps = $props();

	// let targetRotation = $derived(encryptionMode ? 90 : 270);

	// svelte-ignore state_referenced_locally. Seem to work? Wrapping in derived, means animation no work
	let verticalArrowRotationTween = new Tween(targetRotation, { duration: 400 });

	let verticalArrowRotation = $derived(verticalArrowRotationTween.current);
	let flipped = $derived(encryptionMode ? false : true);
	let flippedClass = $derived(flipped ? 'scale-y-[-1]' : '');

	$effect(() => {
		verticalArrowRotationTween.set(targetRotation);
	});
	export function rotateArrows() {
		targetRotation += 180;
		verticalArrowRotationTween.set(targetRotation);
	}

	let paddingResult = $derived(
		isLastBlock ? padder?.validatePadding(plaintextBlock.map((b) => b ?? 0)) : undefined
	);

	function extractPaddingError(result: ReturnType<Padder['validatePadding']>) {
		if (result.valid) {
			return undefined;
		}
		return {
			message: result.message ?? 'Invalid padding',
			indices: result.invalidIndices ?? []
		};
	}
</script>

{#snippet xor()}
	<div
		class={cn('relative rounded-4xl border-default', flippedClass)}
		style={`width: ${xorDiameter}px; height: ${xorDiameter}px;`}
	>
		<div class="absolute top-1/2 h-px w-full -translate-y-1/2 bg-dark dark:bg-light"></div>
		<div class="absolute left-1/2 h-full w-px -translate-x-1/2 bg-dark dark:bg-light"></div>
	</div>
{/snippet}

{#snippet verticalArrow(width = arrowWidth)}
	<div style:width={`${width}px;`} style:height={`${width}px;`} class="flex-center">
		<Arrow
			rotation={verticalArrowRotation}
			length={width}
			thickness={arrowThickness}
			headWidth={arrowHeadWidth}
		/>
	</div>
{/snippet}

<div
	class={cn('flex flex-col items-center', flippedClass)}
	style={`gap: ${gap}px; padding-left: ${addInitPadding ? leftPadding : 0}px;`}
>
	{#if PlainTextBlock}
		<div class={flippedClass}>
			{@render PlainTextBlock(index)}
		</div>
	{:else}
		<div class={flippedClass}>
			<Block
				bytes={plaintextBlock}
				onChange={onChangePlaintext}
				{byteWidth}
				allowEdit={encryptionMode}
				error={paddingResult && extractPaddingError(paddingResult)}
				reserveSpaceForError={true}
				title={`Plaintext Block ${index} (P_${index})`}
				textPosBelow={!encryptionMode}
			/>
		</div>
	{/if}

	{@render verticalArrow()}

	<div class="relative flex items-center justify-center" style="width: 0px;">
		<div
			class="absolute flex items-center gap-1.5 whitespace-nowrap"
			style={`right: calc(100% + ${gap}px + ${xorDiameter / 2}px);`}
		>
			{#if initializationVector}
				{#if IVBlock}
					<div class={flippedClass}>
						{@render IVBlock(index)}
					</div>
				{:else}
					<div class={flippedClass}>
						<Block
							bytes={initializationVector}
							{byteWidth}
							onChange={onChangeIV}
							allowEdit={true}
							reserveSpaceForError={true}
							title="Initialization Vector (IV)"
							classNameTextAbove="absolute -top-7 w-full"
						/>
					</div>
				{/if}
			{/if}

			<Arrow
				rotation={0}
				length={initializationVector ? arrowWidth : toMidLength - gap - xorDiameter / 2}
			/>
		</div>
		<div>
			{@render xor()}
		</div>
	</div>

	{#if FnOutputBlock}
		{@render verticalArrow(arrowWidth)}
		<div class={flippedClass}>
			{@render FnOutputBlock(index)}
		</div>
	{/if}

	{@render verticalArrow(arrowWidth)}

	<div
		class={cn('flex-center border-default', flippedClass)}
		style={`width: ${blockWidth}px;`}
		style:height={`${functionHeight}px;`}
	>
		{#if encryptionMode}
			<!-- Enc_k(P_{index}) = C_{index} -->
			Encryption
		{:else}
			<!-- Dec_k(C_{index}) = P_{index} -->
			Decryption
		{/if}
	</div>

	<div class="relative">
		{@render verticalArrow()}
		{#if !isLastBlock}
			<div class="absolute top-1/2 -translate-y-1/2" style:left={`calc(50% + ${gap}px)`}>
				<div
					class="bg-dark dark:bg-light"
					style={`width: ${toMidLength - gap}px;`}
					style:height={`${arrowThickness}px;`}
				></div>

				{#if VerticalBar}
					{@render VerticalBar()}
				{:else}
					<div
						class="absolute bottom-0 bg-dark dark:bg-light"
						style={`height: ${toXorLength}px;`}
						style:width={`${arrowThickness}px;`}
						style:right={`-${arrowThickness / 2}px`}
					></div>
				{/if}
			</div>
		{/if}
	</div>

	<Block
		bytes={ciphertextBlock}
		className={cn(flippedClass)}
		{byteWidth}
		allowEdit={!encryptionMode}
		onChange={onChangeCiphertext}
	/>

	<p class={cn(flippedClass)}>Ciphertext Block {index} (C_{index})</p>
</div>
