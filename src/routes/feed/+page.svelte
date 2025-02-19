<!--
  Purpose: Homepage with TikTok-style vertical scrolling for GitHub projects
  Context: Main landing page that showcases interesting GitHub repositories in a scrollable format
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
	import { goto } from '$app/navigation';
	import { topicsStore } from '$lib/stores/topics';
	import { topics as allTopics } from '$lib/all_topics';

	import { baseUrl } from 'marked-base-url';
	// Import icons
	import { Star, Eye, GitFork } from 'lucide-svelte';
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
		default_branch: string;
	};

	let projects: Project[] = [];
	let viewedIndices = new Set<number>();
	let currentPage = 1;
	let isLoading = false;
	let hasMore = true;
	const MAX_PAGES = 10;

	// Add this language color mapping object before the fetchProjects function
	const languageColors = {
		TypeScript: '#3178c6',
		JavaScript: '#f1e05a',
		Python: '#3572A5',
		Java: '#b07219',
		Ruby: '#701516',
		Go: '#00ADD8',
		Rust: '#dea584',
		C: '#555555',
		'C++': '#f34b7d',
		'C#': '#178600',
		PHP: '#4F5D95',
		Swift: '#ffac45',
		Kotlin: '#A97BFF',
		Dart: '#00B4AB',
		Shell: '#89e051',
		HTML: '#e34c26',
		CSS: '#563d7c',
		Vue: '#41b883',
		Svelte: '#ff3e00',
		React: '#61dafb'
	} as const;

	// Function to fetch README content
	const fetchReadme = async (author: string, repo: string, default_branch: string) => {
		try {
			const response = await fetch(
				`https://raw.githubusercontent.com/${author}/${repo}/${default_branch}/README.md`
			);
			const data = await response.text();

			// Take only first 20 lines
			const firstXLines = data.split('\n').slice(0, 40).join('\n');
			return firstXLines;
		} catch (error) {
			console.error('Error fetching README:', error);
			return 'Failed to load README';
		}
	};

	const stars = [
		// 'stars:>20000',
		// 'stars:10000..20000',
		// 'stars:5000..10000',
		// 'stars:1000..5000',
		'stars:>1000',
		'stars:500..1000',
		'stars:100..500'
	];

	const languages = [
		'language:typescript',
		'language:javascript',
		'language:python',
		'language:java',
		'language:ruby',
		'language:go',
		'language:rust',
		'language:c',
		'language:cpp',
		'language:csharp',
		'language:php',
		'language:swift',
		'language:kotlin',
		'language:dart',
		'language:shell',
		'language:html',
		'language:css',
		'language:vue',
		'language:svelte',
		'language:react'
	];

	const topics = $topicsStore?.all?.length > 0 ? $topicsStore?.all : allTopics;

	const seenqueries: Record<string, { current_page: number; total_projects: number }> = {};

	function getRandomSearchQuery(attempt: number = 0) {
		const searchParams = new URLSearchParams();

		const randomTopic = `topic:${topics[Math.floor(Math.random() * topics.length)]}`;
		const randomStars = stars[Math.floor(Math.random() * stars.length)];
		const randomLanguages = languages[Math.floor(Math.random() * languages.length)];

		const q = `${randomStars} ${randomTopic}`;

		searchParams.set('q', q);
		searchParams.set('page', '1');
		searchParams.set('per_page', '25');

		if (seenqueries[q] && attempt < 10000) {
			if (seenqueries[q].current_page < seenqueries[q].total_projects / 25) {
				searchParams.set('page', (seenqueries[q].current_page + 1).toString());
			} else {
				return getRandomSearchQuery(attempt + 1);
			}
		}

		return searchParams;
	}

	// Function to fetch projects from GitHub API
	const fetchProjects = async () => {
		const url = new URL('https://api.github.com/search/repositories');

		const query = getRandomSearchQuery();
		const queryKey = query.get('q');

		if (!queryKey) {
			throw new Error('No query key found');
		}

		url.search = query.toString();

		const res = await fetch(url);
		const data = await res.json();

		seenqueries[queryKey] = {
			current_page: parseInt(query.get('page') || '1'),
			total_projects: data.total_count
		};

		return data.items.map((item: any) => ({
			id: item.id,
			name: item.name,
			description: item.description || 'No description provided',
			default_branch: item.default_branch,
			readmeSnippet: null,
			stars: item.stargazers_count,
			forks: item.forks_count,
			watchers: item.watchers_count,
			author: item.owner.login,
			avatar: item.owner.avatar_url,
			language: item.language,
			languageColor: item.language
				? languageColors[item.language as keyof typeof languageColors] || '#858585'
				: undefined,
			stargazersUrl: item.html_url + '/stargazers',
			forksUrl: item.html_url + '/fork'
		}));
	};

	// Function to load more projects and randomly merge them after the current index
	const loadMoreProjects = async (index: number) => {
		if (isLoading || !hasMore) return;

		isLoading = true;
		try {
			const newProjects = await fetchProjects();

			// Split existing projects into before and after index
			const beforeProjects = projects.slice(0, index + 1);
			const afterProjects = projects.slice(index + 1);

			// Randomly merge new projects with remaining projects after index
			const mergedProjects = [];
			const combined = [...afterProjects, ...newProjects];

			while (combined.length > 0) {
				const randomIndex = Math.floor(Math.random() * combined.length);
				mergedProjects.push(combined.splice(randomIndex, 1)[0]);
			}

			// Combine all parts
			projects = [...beforeProjects, ...mergedProjects];

		} catch (error) {
			console.error('Error loading more projects:', error);
		} finally {
			isLoading = false;
		}
	};

	// Update the intersection observer to handle pagination
	const observeElement = (element: HTMLElement, index: number) => {
		const observer = new IntersectionObserver(
			async (entries) => {
				entries.forEach(async (entry) => {
					if (entry.isIntersecting) {
						console.log('isIntersecting', index);
						viewedIndices.add(index);
						viewedIndices = viewedIndices; // trigger reactivity

						// Fetch README when item comes into view
						// Fetch current and next 3 READMEs when an item comes into view
						if (projects[index] && !projects[index].readmeSnippet) {
							// Fetch current README
							const readme = await fetchReadme(
								projects[index].author,
								projects[index].name,
								projects[index].default_branch
							);
							projects[index].readmeSnippet = readme;

							projects = projects; // trigger reactivity
						}

						// Fetch next 2 READMEs
						for (let i = 1; i <= 2; i++) {
							const nextIndex = index + i;
							if (projects[nextIndex] && !projects[nextIndex].readmeSnippet) {
								const nextReadme = await fetchReadme(
									projects[nextIndex].author,
									projects[nextIndex].name,
									projects[nextIndex].default_branch
								);
								projects[nextIndex].readmeSnippet = nextReadme;
							}
						}

						// If we're getting close to the end, load more projects
						if (index >= projects.length - 20) {
							loadMoreProjects(index);
						}
					}
				});
			},
			{ threshold: 0.5 }
		);

		observer.observe(element);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	};

	onMount(async () => {
		// Load initial projects
		const initialProjects = await fetchProjects(1);
		projects = initialProjects;
	});

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

	// Create a function to safely render markdown
	const renderMarkdown = (content: string, repo: string): string => {
		// Force marked to return a string synchronously
		marked.use({
			gfm: true
		});
		marked.use(baseUrl(repo));
		const rawHtml = marked.parse(content, { async: false }) as string;
		return DOMPurify.sanitize(rawHtml, {
			USE_PROFILES: { html: true },
			ALLOWED_TAGS: [
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'p',
				'a',
				'ul',
				'ol',
				'li',
				'code',
				'pre',
				'strong',
				'em',
				'blockquote',
				'table',
				'thead',
				'tbody',
				'tr',
				'th',
				'td',
				'br',
				'hr'
			],
			ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
		});
	};

	// Function to scroll markdown content to top when loaded
	const scrollMarkdownToTop = (node: HTMLElement) => {
		node.scrollTop = 0;
		return {
			update() {
				node.scrollTop = 0;
			}
		};
	};
</script>

<div class="h-screen w-full snap-y snap-mandatory overflow-y-scroll">
	{#each projects as project, index}
		<div
			class="relative flex h-screen w-full snap-start items-center justify-center bg-gradient-to-b from-gray-900 to-black"
			use:observeElement={index}
		>
			<!-- Main Content Container -->
			<div class="mx-auto flex h-full w-full max-w-3xl flex-col justify-between p-6">
				<!-- Add viewed indicator -->
				<div class="absolute top-4 left-4 font-mono text-sm text-gray-400">
					{viewedIndices.has(index) ? '✓ Viewed' : 'New'}
				</div>

				<!-- Top: Repository Name and Description -->
				<div class="space-y-3 pt-4">
					<h1 class="flex items-center gap-2 font-serif text-2xl text-white md:text-3xl">
						{project.name}
						{#if project.language}
							<span class="h-3 w-3 rounded-full" style="background-color: {project.languageColor}"
							></span>
							<span class="font-mono text-sm text-gray-400">{project.language}</span>
						{/if}
					</h1>
					<p class="font-serif text-lg text-gray-200">{project.description}</p>
				</div>

				<!-- Middle: README Content -->
				<div class="my-4 flex flex-1 overflow-y-scroll">
					<div
						class="markdown-content w-full overflow-y-auto rounded-xl bg-gray-800/30 p-6 backdrop-blur-sm"
						use:scrollMarkdownToTop
					>
						{#if !project.readmeSnippet}
							<div class="animate-pulse text-gray-400">Loading README...</div>
						{:else}
							{@html renderMarkdown(project.readmeSnippet, `https://github.com/${project.author}/${project.name}/${project.default_branch}/` )}
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
							class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
							aria-label={`Star repository (${formatNumber(project.stars)} stars)`}
						>
							<Star class="h-8 w-8 text-yellow-400" />
						</a>
						<span class="mt-1 font-mono text-sm text-white">{formatNumber(project.stars)}</span>
					</div>

					<!-- Watchers -->
					<div class="flex flex-col items-center">
						<div
							class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm"
							aria-label={`${formatNumber(project.watchers)} watchers`}
						>
							<Eye class="h-8 w-8 text-blue-400" />
						</div>
						<span class="mt-1 font-mono text-sm text-white">{formatNumber(project.watchers)}</span>
					</div>

					<!-- Forks -->
					<div class="flex flex-col items-center">
						<a
							href={project.forksUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
							aria-label={`Fork repository (${formatNumber(project.forks)} forks)`}
						>
							<GitFork class="h-8 w-8 text-gray-400" />
						</a>
						<span class="mt-1 font-mono text-sm text-white">{formatNumber(project.forks)}</span>
					</div>
				</div>

				<!-- Bottom: Author Info -->
				<div class="flex items-center gap-3 pb-4">
					<img
						src={project.avatar}
						alt={`${project.author}'s avatar`}
						class="h-10 w-10 rounded-full"
					/>
					<div>
						<h2 class="font-mono text-lg text-white">{project.author}</h2>
					</div>
					<a
						href={`https://github.com/${project.author}/${project.name}`}
						target="_blank"
						rel="noopener noreferrer"
						class="ml-auto rounded-lg bg-white/10 px-4 py-2 font-mono text-white transition-colors duration-200 hover:bg-white/20"
					>
						View
					</a>
				</div>
			</div>
		</div>
	{/each}

	{#if isLoading}
		<div
			class="flex h-screen w-full items-center justify-center bg-gradient-to-b from-gray-900 to-black"
		>
			<div class="font-mono text-white">Loading more repositories...</div>
		</div>
	{/if}

	{#if !hasMore && !isLoading}
		<div
			class="flex h-screen w-full items-center justify-center bg-gradient-to-b from-gray-900 to-black"
		>
			<div class="font-mono text-white">You've reached the end!</div>
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
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	.markdown-content pre {
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
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
