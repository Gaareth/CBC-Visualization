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

<ScrollStory
	titles={[
		'What is Padding?',
		'What is a Padding Oracle?',
		'Exploiting - Finding the padding length',
		'Exploiting - Recovering a single byte',
		'Edge cases'
	]}
>
	<h1>Padding Oracle Attack Explained</h1>
	<p>
		The following sections will gradually explain the concept of padding oracles using
		<span class="animate-gradient-text text-gradient-primary font-bold"
			>interactive visualizations</span
		>
		and how they reveal information about the plaintext.
	</p>

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
	<p>How do we now recover more than just a single byte?</p>

	<p>How can we now use the padding oracle to recover information about the second to last byte?</p>

	<p>
		For the last byte, we simply bruteforced the last iv byte until the padding was valid and then
		knew that the last plaintext byte was likely 0x01. How can we apply this to the second to last
		byte?
	</p>

	<p>
		Only again bruteforcing the second to last iv byte until we get valid padding won't work,
		because not only the penultimate plaintext byte needs has to be valid padding but also all the
		following bytes. So we also need to ensure that the last plaintext byte is 0x02, before we
		bruteforce the second to last iv byte.

		How?
		
		
		By modifying the last iv byte to make the last plaintext byte 0x02. Then we can bruteforce the
		second to last iv byte until we get valid padding, which will then mean that the second to last
		and last plaintext byte is 0x02.
	</p>

	<!-- todo: Add content for this section -->
</ScrollStory>

<!-- <ScrollStory sections={[PaddingSection, PaddingOracleSection]}>
	<h1>Padding Oracle Attack Explained</h1>
</ScrollStory> -->
