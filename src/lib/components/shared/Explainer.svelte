<script>
	import ScrollStory from './ScrollStory.svelte';
	import EdgeCaseSection from '../../Sections/EdgeCaseSection.svelte';
	import FindingAByteSection from '../../Sections/FindingAByteSection.svelte';
	import FindingLengthSection from '../../Sections/FindingLengthSection.svelte';
	import PaddingOracleSection from '../../Sections/PaddingOracleSection.svelte';
	import PaddingSection from '../../Sections/PaddingSection.svelte';

	import ExpandingToMultipleSection from '$lib/Sections/ExpandingToMultipleSection.svelte';
	import Card from './Card.svelte';
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
		'Edge cases',
		'Exploiting - Recovering Bytes'
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

	<Card className="border-warning!">
		<h2 class="my-0!">Disclaimer and Literature</h2>
		<p class="m-0! mt-2!">
			I hope I have not made any crude mistakes in the content, but please let me know if you find
			any! Check out <a
				href="https://www.nccgroup.com/research/cryptopals-exploiting-cbc-padding-oracles/"
			>
				this article
			</a>, which actually explains everything really well and also inspired me for these visualizations.
		</p>
	</Card>

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
	<ExpandingToMultipleSection />

	<!-- todo: Add content for this section -->
</ScrollStory>

<!-- <ScrollStory sections={[PaddingSection, PaddingOracleSection]}>
	<h1>Padding Oracle Attack Explained</h1>
</ScrollStory> -->
