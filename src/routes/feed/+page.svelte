<!--
  Purpose: Homepage with TikTok-style vertical scrolling for GitHub projects
  Context: Main landing page that showcases interesting GitHub repositories in a scrollable format
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { marked } from 'marked'
  import { goto } from '$app/navigation'
  import { topicsStore } from '$lib/stores/topics'
  // Import icons
  import { Star, Eye, GitFork } from 'lucide-svelte'
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
  let currentPage = 1
  let isLoading = false
  let hasMore = true
  const MAX_PAGES = 10

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

  // Function to fetch projects from GitHub API
  const fetchProjects = async (page: number) => {
    const url = new URL('https://api.github.com/search/repositories')
    url.searchParams.set('q', 'stars:>1000')
    url.searchParams.set('sort', 'forks')
    url.searchParams.set('order', 'desc')
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', page.toString())

    const res = await fetch(url)
    const data = await res.json()

    return data.items.map((item: any) => ({
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
  }

  // Function to load more projects
  const loadMoreProjects = async () => {
    if (isLoading || !hasMore) return

    isLoading = true
    try {
      const newProjects = await fetchProjects(currentPage + 1)
      projects = [...projects, ...newProjects]
      currentPage++

      if (currentPage >= MAX_PAGES) {
        hasMore = false
      }
    } catch (error) {
      console.error('Error loading more projects:', error)
    } finally {
      isLoading = false
    }
  }

  // Update the intersection observer to handle pagination
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

            // If we're getting close to the end, load more projects
            if (index >= projects.length - 20) {
              loadMoreProjects()
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

    // Load initial projects
    const initialProjects = await fetchProjects(1)
    projects = initialProjects
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
              <Star class="w-8 h-8 text-yellow-400" />
            </a>
            <span class="text-white font-mono text-sm mt-1">{formatNumber(project.stars)}</span>
          </div>

          <!-- Watchers -->
          <div class="flex flex-col items-center">
            <div
              class="p-2 rounded-full bg-gray-800/50 backdrop-blur-sm"
              aria-label={`${formatNumber(project.watchers)} watchers`}
            >
              <Eye class="w-8 h-8 text-blue-400" />
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
              <GitFork class="w-8 h-8 text-gray-400" />
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

  {#if isLoading}
    <div class="h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div class="text-white font-mono">Loading more repositories...</div>
    </div>
  {/if}

  {#if !hasMore && !isLoading}
    <div class="h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div class="text-white font-mono">You've reached the end!</div>
    </div>
  {/if}
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
