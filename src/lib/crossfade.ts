import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';

export const [send, receive] = crossfade({
	// duration: (d) => Math.sqrt(d * 400),
	duration: 600,
	easing: quintOut

	// fallback(node, params) {
	// 	const style = getComputedStyle(node);
	// 	const transform = style.transform === 'none' ? '' : style.transform;

	// 	return {
	// 		duration: 10,
	// 		easing: quintOut,
	// 		// css: (t) => `
	// 		// 	transform: ${transform} scale(${t});
	// 		// 	opacity: ${t}
	// 		// `
	// 		css: (t) => `
	// 			transform: ${transform} translateY(${(1 - t) * 20}px);
	// 			opacity: ${t}
	// 		`
	// 	};
	// }
});
