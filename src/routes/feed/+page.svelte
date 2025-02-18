<!--
  Purpose: Homepage with TikTok-style vertical scrolling for GitHub projects
  Context: Main landing page that showcases interesting GitHub repositories in a scrollable format
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import { goto } from '$app/navigation'
  import { topicsStore } from '$lib/stores/topics'
  // Sample GitHub projects - in a real app, these would come from GitHub API

  type Project = {
    id: number;
    name: string;
    description: string;
    readmeSnippet: string;
    stars: number;
    forks: number;
    watchers: number;
    author: string;
    avatar: string;
    language?: string;
    languageColor?: string;
    stargazersUrl: string;
    forksUrl: string;
  }

  let projects: Project[] = []
  let viewedIndices = new Set<number>()

  // Function to fetch README content
  const fetchReadme = async (author: string, repo: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${author}/${repo}/readme`)
      const data = await response.json()
      // GitHub returns README content in base64
      const decodedContent = atob(data.content)
      // Take only first 20 lines
      const first20Lines = decodedContent.split('\n').slice(0, 40).join('\n')
      return first20Lines
    } catch (error) {
      console.error('Error fetching README:', error)
      return 'Failed to load README'
    }
  }

  // Update the intersection observer to fetch README when item is viewed
  const observeElement = (element: HTMLElement, index: number) => {
    const observer = new IntersectionObserver(
      async (entries) => {
        entries.forEach(async entry => {
          if (entry.isIntersecting) {
            viewedIndices.add(index)
            viewedIndices = viewedIndices // trigger reactivity

            // Fetch README when item comes into view
            if (projects[index] && !projects[index].readmeSnippet.includes('#')) {
              const readme = await fetchReadme(projects[index].author, projects[index].name)
              projects[index].readmeSnippet = readme
              projects = projects // trigger reactivity
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(element)
    return {
      destroy() {
        observer.disconnect()
      }
    }
  }

  onMount(async () => {
    // Redirect to setup if no topics selected
    if ($topicsStore.selected.size === 0) {
      goto('/setup')
    }

    const url = new URL('https://api.github.com/search/repositories')
    url.searchParams.set('q', [...$topicsStore.selected].map(t => t).join(' ') + ' stars:>1000')
    url.searchParams.set('per_page', '100')
    const res = await fetch(url)
    const data = await res.json()
    console.log(data)

    projects = data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || 'No description provided',
      readmeSnippet: 'Loading README...',
      stars: item.stargazers_count,
      forks: item.forks_count,
      watchers: item.watchers_count,
      author: item.owner.login,
      avatar: item.owner.avatar_url,
      language: item.language,
      languageColor: '#3178c6',
      stargazersUrl: item.html_url + '/stargazers',
      forksUrl: item.html_url + '/fork'
    }))
  })


  // Format numbers to human readable format (e.g., 73.5k)
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Format date to relative time (e.g., "2 days ago")
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  };
</script>

<div class="snap-y snap-mandatory h-screen w-full overflow-y-scroll">
  {#each projects as project, index}
    <div
      class="snap-start h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black relative"
      use:observeElement={index}
    >
      <!-- Main Content Container -->
      <div class="h-full w-full max-w-3xl mx-auto flex flex-col justify-between p-6">
        <!-- Add viewed indicator -->
        <div class="absolute top-4 left-4 text-gray-400 font-mono text-sm">
          {viewedIndices.has(index) ? '✓ Viewed' : 'New'}
        </div>

        <!-- Top: Repository Name and Description -->
        <div class="pt-4 space-y-3">
          <h1 class="text-white text-2xl md:text-3xl font-serif flex items-center gap-2">
            {project.name}
            {#if project.language}
              <span
                class="w-3 h-3 rounded-full"
                style="background-color: {project.languageColor}"
              ></span>
              <span class="text-sm font-mono text-gray-400">{project.language}</span>
            {/if}
          </h1>
          <p class="text-gray-200 text-lg font-serif">{project.description}</p>
        </div>

        <!-- Middle: README Content -->
        <div class="flex-1 flex items-center overflow-hidden my-4">
          <div class="w-full bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 markdown-content overflow-y-auto">
            {#if project.readmeSnippet.includes('Loading')}
              <div class="text-gray-400 animate-pulse">Loading README...</div>
            {:else}
              <div class="prose prose-invert prose-sm md:prose-base max-w-none">
                {@html marked(project.readmeSnippet)}
              </div>
            {/if}
          </div>
        </div>

        <!-- Right Side: Stats -->
        <div class="absolute right-4 bottom-24 flex flex-col items-center gap-6">
          <!-- Stars -->
          <div class="flex flex-col items-center">
            <a
              href={project.stargazersUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 rounded-full bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 transition-colors"
              aria-label={`Star repository (${formatNumber(project.stars)} stars)`}
            >
              <svg class="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </a>
            <span class="text-white font-mono text-sm mt-1">{formatNumber(project.stars)}</span>
          </div>

          <!-- Watchers -->
          <div class="flex flex-col items-center">
            <div
              class="p-2 rounded-full bg-gray-800/50 backdrop-blur-sm"
              aria-label={`${formatNumber(project.watchers)} watchers`}
            >
              <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span class="text-white font-mono text-sm mt-1">{formatNumber(project.watchers)}</span>
          </div>

          <!-- Forks -->
          <div class="flex flex-col items-center">
            <a
              href={project.forksUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 rounded-full bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 transition-colors"
              aria-label={`Fork repository (${formatNumber(project.forks)} forks)`}
            >
              <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 1a1.993 1.993 0 0 0-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V6.5l3 3v1.78A1.993 1.993 0 0 0 5 15a1.993 1.993 0 0 0 1-3.72V9.5l3-3V4.72A1.993 1.993 0 0 0 8 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM8 4.2c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"/>
              </svg>
            </a>
            <span class="text-white font-mono text-sm mt-1">{formatNumber(project.forks)}</span>
          </div>
        </div>

        <!-- Bottom: Author Info -->
        <div class="flex items-center gap-3 pb-4">
          <img
            src={project.avatar}
            alt={`${project.author}'s avatar`}
            class="w-10 h-10 rounded-full"
          />
          <div>
            <h2 class="text-white font-mono text-lg">{project.author}</h2>
          </div>
          <a
            href={`https://github.com/${project.author}/${project.name}`}
            target="_blank"
            rel="noopener noreferrer"
            class="ml-auto bg-white/10 hover:bg-white/20 transition-colors duration-200 text-white font-mono py-2 px-4 rounded-lg"
          >
            View Repository
          </a>
        </div>
      </div>
    </div>
  {/each}
</div>

<!-- Add progress indicator -->
<div class="fixed bottom-4 left-4 bg-gray-800/50 backdrop-blur-sm rounded-lg p-2 text-white font-mono text-sm">
  Viewed: {viewedIndices.size}/{projects.length}
</div>

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .snap-y::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  .snap-y {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }

  .markdown-content pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }

  /* Style markdown content */
  :global(.prose) {
    color: rgb(229 231 235); /* gray-200 */
  }

  :global(.prose a) {
    color: rgb(96 165 250); /* blue-400 */
  }

  :global(.prose code) {
    color: rgb(249 168 212); /* pink-300 */
    background: rgb(31 41 55); /* gray-800 */
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
  }

  :global(.prose pre) {
    background: rgb(17 24 39); /* gray-900 */
    padding: 1em;
    border-radius: 0.5em;
  }
</style>
