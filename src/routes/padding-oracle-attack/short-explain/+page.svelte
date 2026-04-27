<script>
	import Card from '$lib/components/shared/Card.svelte';
	import { resolve } from '$app/paths';
	import ExplainWrapper from '$lib/components/shared/ExplainWrapper.svelte';
	import { goto } from '$app/navigation';
</script>

<div class="flex-center min-h-[calc(100dvh-256px)]">
	<ExplainWrapper
		wrapperClass="w-5xl mx-auto"
		title="Padding Oracle Attack - Quick Explanation"
		next={async () => await goto(resolve('/padding-oracle-attack'))}
	>
		<div class="grid grid-cols-6 items-center gap-10">
			<div class="col-span-4">
				<p class="mb-2 text-justify">
					Quick explainer on how you can exploit the padding oracle to find out when the decrypted
					plaintext has valid padding. For more details, see <a
						href={resolve('/padding-oracle-attack/explain')}
						class="hover:underline">here</a
					>
				</p>
				<ol class="list-decimal space-y-3 ps-7">
					<li class="text-muted-foreground">Set the IV to zero</li>
					<li>
						Change the last byte of the IV until you get valid padding

						<p>
							You now know that the last plaintext byte is (likely)
							<span class="text-blue-400"> 0x01 </span>
						</p>

						<p class="my-1 text-center">
							<span class="text-blue-400">0x01</span> = <span class="text-green-400">IV[-1]</span>
							XOR
							<span class="text-red-500">DEC[-1]</span>
						</p>
					</li>
					<li>
						Recover the plaintext byte using XOR operations
						<div class="my-1 text-center">
							<p>
								<span class="text-red-500">DEC[-1]</span> = <span class="text-blue-400">0x01</span>
								XOR
								<span class="text-green-400">IV[-1]</span>
							</p>

							<p>
								<span class="text-blue-400">P[-1]</span> =
								<span class="text-green-400">IV[-1]</span>
								XOR
								<span class="text-red-500">DEC[-1]</span>
							</p>
						</div>
					</li>

					<li>
						Modify the known bytes to prepare the padding oracle for the next byte (0x02). Go to
						step 2.
						<p class="text-center">
							<span class="text-green-400">IV[-1]</span> =
							<span class="text-blue-400">0x02</span>
							XOR
							<span class="text-red-500">DEC[-1]</span>
						</p>
					</li>
				</ol>
			</div>

			<div class="col-span-2 flex justify-center gap-1">
				<div class="flex w-fit flex-col gap-1">
					<a href={resolve('/padding-oracle-attack')} class="button-default input-layer-2">
						See it in action
					</a>
				</div>
			</div>
		</div>
	</ExplainWrapper>
</div>
