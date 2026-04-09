<script>
	import Card from './Card.svelte';
	import CBCBlock from '../CBC/CBCBlock.svelte';
	import CBCDecryption from '../CBC/CBCDecryption.svelte';
	import CBCEncryption from '../CBC/CBCEncryption.svelte';
	import PaddingLengthFinder from '../CBCInteractions/PaddingLengthFinder.svelte';
	import ScrollStory from './ScrollStory.svelte';
	import EdgeCaseSection from '../../Sections/EdgeCaseSection.svelte';
	import FindingAByteSection from '../../Sections/FindingAByteSection.svelte';
	import FindingLengthSection from '../../Sections/FindingLengthSection.svelte';
	import PaddingOracleSection from '../../Sections/PaddingOracleSection.svelte';
	import PaddingSection from '../../Sections/PaddingSection.svelte';
	import StorySection from './StorySection.svelte';
</script>

<!-- <ScrollStory sections=[PaddingSection]>
	<h1>Padding Oracle Attack Explained</h1>

</ScrollStory>

	<PaddingSection />

	<PaddingOracleSection /> -->

<ScrollStory>
	<h1>Padding Oracle Attack Explained</h1>

	<PaddingSection />
	<PaddingOracleSection />

	<h2>Exploitation</h2>
	<p>
		When modifying the IV or the penultimate block, we can make predictable changes to the decrypted
		plaintext. Random changes will likely result in invalid padding, but a valid results tells you
		something about the decrypted plaintext. This can be exploited to recover the plaintext byte by
		byte.
	</p>

	<FindingLengthSection />
	<FindingAByteSection />
	<EdgeCaseSection />

	<h3>Exploitation - Recovering Bytes</h3>
	<!-- todo: Add content for this section -->
</ScrollStory>

<!-- <ScrollStory sections={[PaddingSection, PaddingOracleSection]}>
	<h1>Padding Oracle Attack Explained</h1>
</ScrollStory> -->
