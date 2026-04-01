<script lang="ts">
	import { rotatedBoundingBox } from './utils/compute';
	import { cn } from './utils/styling';

	export interface ArrowProps {
		/** Total arrow length in px */
		length: number;
		/** Shaft stroke thickness in px */
		thickness?: number;
		/** Arrowhead height (perpendicular to shaft) in px — fixed, never scales with length */
		headWidth?: number;
		/** Arrowhead depth (along shaft) in px — fixed, never scales with length */
		headLength?: number;
		/** Rotation in degrees */
		rotation?: number;
		/** Whether to render the arrowhead */
		renderHead?: boolean;
		/** Gradient start color (falls back to currentColor) */
		colorStart?: string;
		/** Gradient end color (defaults to colorStart) */
		colorEnd?: string;
		className?: string;
		headPosition?: 'start' | 'end' | 'both';
	}

	let {
		length,
		thickness = 3,
		headWidth = 15,
		headLength = 15,
		rotation = 0,
		renderHead = true,
		colorStart,
		colorEnd = colorStart,
		className = '',
		headPosition = 'end',
		...restProps
	}: ArrowProps = $props();

	// Unique gradient id per instance
	const gradientId = `grad-${Math.random().toString(36).slice(2)}`;
	const fillColor = $derived(colorStart ? `url(#${gradientId})` : 'currentColor');

	// The shaft ends where the head begins.
	// Both headWidth and headLength are absolute px — independent of `length`.
	const shaftEnd = $derived(
		Math.max(length - (headPosition === 'end' || headPosition === 'both' ? headLength : 0), 0)
	);
	const shaftStart = $derived(headPosition === 'start' || headPosition === 'both' ? headLength : 0);

	// SVG canvas in un-rotated space: width=length, height=headWidth
	// A small buffer avoids clipping the stroke at the edges.
	// const buffer = $derived(thickness);
	const buffer = 0;
	const canvasW = $derived(length + buffer);
	const canvasH = $derived(headWidth + buffer);

	// Closed triangle: tip at right edge, base flush with shaft end
	const headPointsEnd = $derived(
		`${length},${headWidth / 2 + buffer / 2} ` +
			`${shaftEnd},${buffer / 2} ` +
			`${shaftEnd},${headWidth + buffer / 2}`
	);

	const headPointsStart = $derived(
		`0,${headWidth / 2 + buffer / 2} ` +
			`${headLength},${buffer / 2} ` +
			`${headLength},${headWidth + buffer / 2}`
	);

	// Wrapper dimensions account for rotation so rotated arrow stays in flow
	const bbox = $derived(rotatedBoundingBox(canvasH, canvasW, rotation));
</script>

<!--
  The div is sized to the rotated bounding box so adjacent elements
  are never overlapped regardless of rotation angle.
-->
<div
	style:width="{bbox.width}px"
	style:height="{bbox.height}px"
	style:display="inline-flex"
	style:align-items="center"
	style:justify-content="center"
	style:flex-shrink="0"
>
	<svg
		viewBox="0 0 {canvasW} {canvasH}"
		width={canvasW}
		height={canvasH}
		class={cn('arrow text-dark dark:text-light', className)}
		style:transform="rotate({rotation}deg)"
		style:overflow="visible"
		aria-hidden="true"
		{...restProps}
	>
		<defs>
			{#if colorStart}
				<linearGradient
					id={gradientId}
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stop-color={colorStart} />
					<stop offset="100%" stop-color={colorEnd} />
				</linearGradient>
			{/if}
		</defs>

		<!-- Shaft: horizontal line from left edge to where head begins -->
		<line
			x1={shaftStart}
			y1={headWidth / 2 + buffer / 2}
			x2={shaftEnd}
			y2={headWidth / 2 + buffer / 2}
			stroke={fillColor}
			stroke-width={thickness}
			//   stroke-linecap="round"
			vector-effect="non-scaling-stroke"
		/>

		<!-- Closed arrowhead: fixed size triangle regardless of arrow length -->
		{#if renderHead}
			{#if headPosition == 'start' || headPosition == 'both'}
				<polygon points={headPointsStart} fill={fillColor} />
			{/if}

			{#if headPosition == 'end' || headPosition == 'both'}
				<polygon points={headPointsEnd} fill={fillColor} />
			{/if}
		{/if}
	</svg>
</div>

<style>
	.arrow {
		display: block;
	}
</style>
