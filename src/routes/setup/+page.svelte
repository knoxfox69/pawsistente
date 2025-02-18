<script lang="ts">
	import { topics } from '$lib/topics'
	import { topicsStore } from '$lib/stores/topics';
	import { goto } from '$app/navigation';

	let newTopic = '';

	$: console.log($topicsStore.selected)
	$: canContinue = $topicsStore.selected.size > 0 || $topicsStore.custom.length > 0;

	function addCustomTopic(e: Event) {
		e.preventDefault();
		if (newTopic.trim()) {
			topicsStore.addCustomTopic(newTopic.trim().toLowerCase());
			topicsStore.toggleTopic(newTopic.trim().toLowerCase());
			newTopic = '';
		}
	}
</script>

<!-- Add custom topic -->
<div class="p-6 pb-0">
	<form
		onsubmit={addCustomTopic}
		class="flex gap-2 items-center"
	>
		<input
			type="text"
			bind:value={newTopic}
			placeholder="Add your own topic..."
			class="flex-1 px-4 py-2 rounded-full backdrop-blur-sm
				   focus:outline-none focus:ring-2 focus:ring-blue-400
				   border border-gray-800/50
				   bg-gray-800/30 text-gray-200 text-sm
				   placeholder:text-gray-500"
		/>
		<button
			type="submit"
			class="px-4 py-2 rounded-full backdrop-blur-sm
				   focus:outline-none focus:ring-2 focus:ring-blue-400
				   border border-gray-800/50 hover:border-blue-400/50
				   bg-gray-800/30 hover:bg-gray-700/40 text-sm
				   text-gray-200"
		>
			Add
		</button>
	</form>
</div>

<!-- Custom topics section (if any exist) -->
{#if $topicsStore.custom.length > 0}
	<div class="p-6">
		<h3 class="text-sm font-mono text-gray-400 mb-3">Custom Topics</h3>
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each $topicsStore.custom as topic}
				<div
					class="group w-full px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300
						   flex items-center justify-between cursor-pointer
						   focus:outline-none focus:ring-2 focus:ring-blue-400
						   border border-gray-800/50 hover:border-blue-400/50
						   bg-gray-800/30 hover:bg-gray-700/40 text-sm
						   {$topicsStore.selected.has(topic) ? 'bg-blue-900/30 border-blue-400/50' : ''}"
					onclick={() => topicsStore.toggleTopic(topic)}
					onkeydown={(e) => e.key === 'Enter' && topicsStore.toggleTopic(topic)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-center gap-2">
						{#if $topicsStore.selected.has(topic)}
							<span class="text-yellow-400 text-xs">★</span>
						{/if}
						<span class="capitalize font-serif text-gray-200">{topic}</span>
					</div>
					<button
						class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
						onclick={(e) => {
							e.stopPropagation();
							topicsStore.removeCustomTopic(topic);
						}}
					>
						×
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Predefined topics grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
	{#each Object.entries(topics) as [topic, value]}
		<div class="space-y-3">
			<button
				onclick={() => {
					topicsStore.toggleTopic(topic);
					topicsStore.toggleExpanded(topic);
				}}
				class="w-full px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300
					   flex items-center justify-between
					   focus:outline-none focus:ring-2 focus:ring-blue-400
					   border border-gray-800/50 hover:border-blue-400/50
					   bg-gray-800/30 hover:bg-gray-700/40 text-sm
					   {$topicsStore.selected.has(topic) ? 'bg-blue-900/30 border-blue-400/50' : ''}"
			>
				<div class="flex items-center gap-2">
					{#if $topicsStore.selected.has(topic)}
						<span class="text-yellow-400 text-xs">★</span>
					{/if}
					<span class="capitalize font-serif text-gray-200">{topic.replace(/_/g, ' ')}</span>
				</div>
				{#if typeof value === 'object'}
					<span class="text-blue-400 text-sm transition-transform duration-300 {$topicsStore.expanded.has(topic) ? 'rotate-90' : ''}">
						→
					</span>
				{/if}
			</button>

			{#if $topicsStore.expanded.has(topic)}
				<div class="pl-4 space-y-3 border-l border-gray-800/50">
					{#if Array.isArray(value)}
						{#each value as item}
							<button
								onclick={() => topicsStore.toggleTopic(item)}
								class="w-full px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300
									   flex items-center justify-between
									   focus:outline-none focus:ring-2 focus:ring-blue-400
									   border border-gray-800/50 hover:border-blue-400/50
									   bg-gray-800/30 hover:bg-gray-700/40 text-sm
									   {$topicsStore.selected.has(item) ? 'bg-blue-900/30 border-blue-400/50' : ''}"
							>
								<div class="flex items-center gap-2">
									{#if $topicsStore.selected.has(item)}
										<span class="text-yellow-400 text-xs">★</span>
									{/if}
									<span class="capitalize font-serif text-gray-200">{item.replace(/-/g, ' ')}</span>
								</div>
							</button>
						{/each}
					{:else}
						{#each Object.entries(value) as [subtopic, subvalue]}
							<button
								onclick={() => {
									topicsStore.toggleTopic(subtopic);
									topicsStore.toggleExpanded(subtopic);
								}}
								class="w-full px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300
									   flex items-center justify-between
									   focus:outline-none focus:ring-2 focus:ring-blue-400
									   border border-gray-800/50 hover:border-blue-400/50
									   bg-gray-800/30 hover:bg-gray-700/40 text-sm
									   {$topicsStore.selected.has(subtopic) ? 'bg-blue-900/30 border-blue-400/50' : ''}"
							>
								<div class="flex items-center gap-2">
									{#if $topicsStore.selected.has(subtopic)}
										<span class="text-yellow-400 text-xs">★</span>
									{/if}
									<span class="capitalize font-serif text-gray-200">{subtopic.replace(/_/g, ' ')}</span>
								</div>
								{#if typeof subvalue === 'object'}
									<span class="text-blue-400 text-sm transition-transform duration-300 {$topicsStore.expanded.has(subtopic) ? 'rotate-90' : ''}">
										→
									</span>
								{/if}
							</button>

							{#if $topicsStore.expanded.has(subtopic)}
								<div class="pl-4 space-y-3 border-l border-gray-800/50">
									{#if Array.isArray(subvalue)}
										{#each subvalue as item}
											<button
												onclick={() => topicsStore.toggleTopic(item)}
												class="w-full px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300
													   flex items-center justify-between
													   focus:outline-none focus:ring-2 focus:ring-blue-400
													   border border-gray-800/50 hover:border-blue-400/50
													   bg-gray-800/30 hover:bg-gray-700/40 text-sm
													   {$topicsStore.selected.has(item) ? 'bg-blue-900/30 border-blue-400/50' : ''}"
											>
												<div class="flex items-center gap-2">
													{#if $topicsStore.selected.has(item)}
														<span class="text-yellow-400 text-xs">★</span>
													{/if}
													<span class="capitalize font-serif text-gray-200">{item.replace(/-/g, ' ')}</span>
												</div>
											</button>
										{/each}
									{:else}
										{#each Object.entries(subvalue) as [subsubtopic, subsubvalue]}
											<button
												onclick={() => topicsStore.toggleTopic(subsubtopic)}
												class="w-full px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300
													   flex items-center justify-between
													   focus:outline-none focus:ring-2 focus:ring-blue-400
													   border border-gray-800/50 hover:border-blue-400/50
													   bg-gray-800/30 hover:bg-gray-700/40 text-sm
													   {$topicsStore.selected.has(subsubtopic) ? 'bg-blue-900/30 border-blue-400/50' : ''}"
											>
												<div class="flex items-center gap-2">
													{#if $topicsStore.selected.has(subsubtopic)}
														<span class="text-yellow-400 text-xs">★</span>
													{/if}
													<span class="capitalize font-serif text-gray-200">
														{subsubtopic.replace(/_/g, ' ')}
													</span>
												</div>
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>

<!-- Selected topics summary -->
{#if $topicsStore.selected.size > 0}
	<div class="mt-8 p-6">
		<h3 class="text-lg font-serif font-semibold mb-4 text-gray-200">Selected Topics</h3>
		<div class="flex flex-wrap gap-3">
			{#each [...$topicsStore.selected] as topic}
				<span class="bg-gray-800/50 backdrop-blur-sm text-gray-200
						   px-4 py-2 rounded-lg text-sm font-mono
						   border border-gray-700/50">
					{topic.replace(/-/g, ' ')}
				</span>
			{/each}
		</div>
	</div>
{/if}

<div class="fixed bottom-6 right-6 flex gap-3">
	{#if !canContinue}
		<button
			onclick={() => goto('/feed')}
			class="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-gray-600/30"
		>
			Skip for now
		</button>
	{/if}

	<button
		onclick={() => goto('/feed')}
		class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
	>
		{canContinue ? 'Continue to Feed' : 'Continue without topics'}
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
		</svg>
	</button>
</div>

