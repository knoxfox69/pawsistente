<!--
  Purpose: Homepage with TikTok-style vertical scrolling for GitHub projects
  Context: Main landing page that showcases interesting GitHub repositories in a scrollable format
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';
	import { topicsStore } from '$lib/stores/topics';
	import { topics as allTopics } from '$lib/all_topics';
	import { Octokit } from '@octokit/rest';
	import { Twitter } from 'lucide-svelte';
	import { getRepositories } from '$lib/db/client';

	import { baseUrl } from 'marked-base-url';
	import { markedEmoji } from 'marked-emoji';
	// Import icons
	import { Star, Eye, GitFork, Share2, Settings, Globe } from 'lucide-svelte';
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
	let isLoading = false;
	let hasMore = true;
	let hasShownFollowMessage = false;
	// Cache for prefetched promoted repos
	let promotedReposCache: Map<number, Project> = new Map();

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

	const topics = $topicsStore.size > 0 ? [...$topicsStore] : allTopics;

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

	const fetchProject = async (project: string, author: string) => {
		const url = new URL(`https://api.github.com/repos/${author}/${project}`);
		const res = await fetch(url);
		const data = await res.json();

		return {
			name: data.name,
			description: data.description,
			default_branch: data.default_branch,
			readmeSnippet: null,
			language: data.language,
			languageColor: data.language
				? languageColors[data.language as keyof typeof languageColors] || '#858585'
				: undefined,
			stargazersUrl: data.stargazers_url,
			forksUrl: data.forks_url,
			author: data.owner.login,
			avatar: data.owner.avatar_url,
			stars: data.stargazers_count,
			forks: data.forks_count,
			watchers: data.watchers_count,
			id: data.id
		};
	};

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

	function seturlparams(project: Project) {
		const url = new URL(window.location.href);
		url.searchParams.set('project', project.name);
		url.searchParams.set('author', project.author);
		window.history.replaceState({}, '', url.toString());
	}

	// Function to prefetch promoted repos
	const prefetchPromotedRepos = async (currentIndex: number) => {
		// Calculate the next two positions where promoted repos will be needed
		const currentPosition = Math.floor((currentIndex + 1) / 10);
		const nextPositions = [currentPosition + 1, currentPosition + 2];

		// Prefetch for each position if not already in cache
		for (const position of nextPositions) {
			if (!promotedReposCache.has(position)) {
				const promotedRepo = await getPromotedRepo(position);
				promotedReposCache.set(position, promotedRepo);
			}
		}
	};

	// Function to get a promoted repo (either from cache or fetch new)
	const getPromotedRepoWithCache = async (position: number): Promise<Project> => {
		// Check cache first
		if (promotedReposCache.has(position)) {
			const cachedRepo = promotedReposCache.get(position);
			// Remove from cache after using
			promotedReposCache.delete(position);
			return cachedRepo!;
		}

		// If not in cache, fetch directly
		return await getPromotedRepo(position);
	};

	// Function to insert promoted repos at intervals
	const insertPromotedRepos = async (index: number) => {
		// Check if we're at a position where we should insert a promoted repo (every 10 items)
		if ((index + 1) % 10 === 0) {
			const promotedPosition = Math.floor(index / 10);
			const promotedRepo = await getPromotedRepoWithCache(promotedPosition);
			
			// Insert the promoted repo after the current index
			projects = [
				...projects.slice(0, index + 1),
				promotedRepo,
				...projects.slice(index + 1)
			];

			// Prefetch next promoted repos
			await prefetchPromotedRepos(index);
		} else if ((index + 1) % 10 >= 8) {
			// If we're within 2 positions of needing a promoted repo, start prefetching
			await prefetchPromotedRepos(index);
		}
	};

	// Function to get a random promoted repository
	const getPromotedRepo = async (position: number): Promise<Project> => {
		try {
			// Get promoted repositories from the database
			const promotedRepos = await getRepositories({
				limit: 10,
				isPinned: 1,
				orderBy: 'updated_at',
				order: 'desc'
			});

			console.log("promotedRepos", promotedRepos);

			// If no promoted repos in DB, fall back to default ones
			if (!promotedRepos.length) {
				const defaultRepos = [
					{
						id: -2,
						name: 'gittok.dev',
						description: 'A TikTok-style interface for discovering amazing open source projects. Built with SvelteKit and Tailwind CSS.',
						readmeSnippet: '# GitTok\n\nGitTok is an innovative way to discover open source projects. With its TikTok-inspired interface, you can effortlessly scroll through carefully curated GitHub repositories.\n\n## Features\n\n- Vertical scrolling interface\n- Real-time README previews\n- GitHub statistics integration\n- Beautiful dark mode design\n- Mobile-first responsive layout',
						stars: 1337,
						forks: 42,
						watchers: 100,
						author: 'BlackShoreTech',
						avatar: 'https://avatars.githubusercontent.com/u/583231?v=4',
						language: 'Svelte',
						languageColor: '#ff3e00',
						stargazersUrl: 'https://github.com/gittok/gittok/stargazers',
						forksUrl: 'https://github.com/gittok/gittok/fork',
						default_branch: 'main'
					},
					{
						id: -3,
						name: 'Sponsor GitTok',
						description: 'Want to promote your open source project here? Reach thousands of developers daily!',
						readmeSnippet: '# Promote Your Project\n\nReach thousands of developers who are actively discovering new open source projects.\n\n## Why Sponsor?\n\n- Increase project visibility\n- Reach active developers\n- Support open source\n- Boost community engagement\n\nContact us at sponsor@gittok.dev',
						stars: 0,
						forks: 0,
						watchers: 0,
						author: 'sponsor',
						avatar: 'https://avatars.githubusercontent.com/u/583231?v=4',
						language: undefined,
						languageColor: undefined,
						stargazersUrl: 'mailto:sponsor@gittok.dev',
						forksUrl: 'mailto:sponsor@gittok.dev',
						default_branch: 'main'
					}
				];
				return defaultRepos[position % defaultRepos.length];
			}

			// Convert database repository to Project type
			const repo = promotedRepos[position % promotedRepos.length];
			const readme = await fetchReadme(
				repo.full_name.split('/')[0],
				repo.name,
				'main' // Assuming main branch, you might want to store this in the database
			);

			return {
				id: -2,
				name: repo.name,
				description: repo.description || '',
				readmeSnippet: readme,
				stars: repo.stargazers_count,
				forks: repo.fork,
				watchers: repo.stargazers_count, // Using stars count as watchers since we don't store watchers
				author: repo.full_name.split('/')[0],
				avatar: `https://github.com/${repo.full_name.split('/')[0]}.png`,
				language: repo.language || undefined,
				languageColor: repo.language ? languageColors[repo.language as keyof typeof languageColors] : undefined,
				stargazersUrl: `${repo.html_url}/stargazers`,
				forksUrl: `${repo.html_url}/fork`,
				default_branch: 'main' // Assuming main branch
			};
		} catch (error) {
			console.error('Error fetching promoted repo:', error);
			// Return the sponsor card as fallback
			return {
				id: -3,
				name: 'Sponsor GitTok',
				description: 'Want to promote your open source project here? Reach thousands of developers daily!',
				readmeSnippet: '# Promote Your Project\n\nReach thousands of developers who are actively discovering new open source projects.\n\n## Why Sponsor?\n\n- Increase project visibility\n- Reach active developers\n- Support open source\n- Boost community engagement\n\nContact us at sponsor@gittok.dev',
				stars: 0,
				forks: 0,
				watchers: 0,
				author: 'sponsor',
				avatar: 'https://avatars.githubusercontent.com/u/583231?v=4',
				language: undefined,
				languageColor: undefined,
				stargazersUrl: 'mailto:sponsor@gittok.dev',
				forksUrl: 'mailto:sponsor@gittok.dev',
				default_branch: 'main'
			};
		}
	};

	// Update the intersection observer to handle pagination and promoted repos
	const observeElement = (element: HTMLElement, index: number) => {
		const observer = new IntersectionObserver(
			async (entries) => {
				entries.forEach(async (entry) => {
					if (entry.isIntersecting) {
						seturlparams(projects[index]);
						console.log('isIntersecting', index);
						viewedIndices.add(index);
						viewedIndices = viewedIndices; // trigger reactivity

						// Show follow message after viewing 10 items
						if (viewedIndices.size === 10 && !hasShownFollowMessage) {
							hasShownFollowMessage = true;
							// Insert the follow message card after the current item
							const followMessageProject: Project = {
								id: -1,
								name: 'Enjoying GitTok?',
								description:
									"If you're finding this useful, consider following me on Twitter for more cool projects!",
								readmeSnippet: '',
								stars: 0,
								forks: 0,
								watchers: 0,
								author: '@brsc2909',
								avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
								stargazersUrl: '',
								forksUrl: '',
								default_branch: ''
							};
							projects = [
								...projects.slice(0, index + 1),
								followMessageProject,
								...projects.slice(index + 1)
							];
						}

						// Insert promoted repos at intervals
						await insertPromotedRepos(index);

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
		const octokit = new Octokit();
		// Get all the emojis available to use on GitHub.
		const res = await octokit.rest.emojis.get();

		const emojis = res.data;

		marked.use(
			markedEmoji({
				emojis,
				renderer: (token) =>
					`<img alt="${token.name}" src="${token.emoji}" class="marked-emoji-img">`
			})
		);

		// Load initial projects
		const url = new URL(window.location.href);
		const project = url.searchParams.get('project');
		const author = url.searchParams.get('author');
		const initialProjects = [];
		if (project && author) {
			const initialProject = await fetchProject(project, author);
			initialProjects.push(initialProject);
		}

		prefetchPromotedRepos(10);

		initialProjects.push(...(await fetchProjects()));
		
		projects = initialProjects;
	});

	// Format numbers to human readable format (e.g., 73.5k)
	const formatNumber = (num: number): string => {
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'k';
		}
		return num.toString();
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

	// Add share functionality
	const shareProject = async (project: Project) => {
		const shareUrl = `https://gittok.dev/feed?project=${project.name}&author=${project.author}`;
		const shareText = `Check out ${project.name} on gittok.dev`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: project.name,
					text: shareText,
					url: shareUrl
				});
			} catch (err) {
				if (err instanceof Error && err.name !== 'AbortError') {
					console.error('Error sharing:', err);
					// Fallback to clipboard
					await navigator.clipboard.writeText(shareUrl);
					alert('Link copied to clipboard!');
				}
			}
		} else {
			// Fallback for browsers that don't support Web Share API
			await navigator.clipboard.writeText(shareUrl);
			alert('Link copied to clipboard!');
		}
	};
</script>

<div class="h-screen w-full snap-y snap-mandatory overflow-y-scroll svelte-16xb542" role="list" aria-label="GitHub Projects">
	<!-- Add Settings and About Links -->
	<div class="fixed top-4 right-4 z-50 flex gap-4">
		<a
			href="/about"
			class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
			aria-label="About"
		>
			<Globe class="h-6 w-6 text-gray-400" />
		</a>
		<a
			href="/setup"
			class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
			aria-label="Settings"
		>
			<Settings class="h-6 w-6 text-gray-400" />
		</a>
	</div>

	{#each projects as project, index}
		<div
			class="project-container relative flex h-screen w-full snap-start items-center justify-center bg-gradient-to-b from-gray-900 to-black"
			use:observeElement={index}
		>
			<!-- Main Content Container -->
			<div class="mx-auto flex h-full w-full max-w-3xl flex-col p-6">
				{#if project.id === -1}
					<!-- Special Follow Message Card -->
					<div class="flex h-full flex-col items-center justify-center space-y-8 text-center">
						<h1 class="font-serif text-4xl text-white">{project.name}</h1>
						<p class="max-w-lg font-serif text-xl text-gray-200">{project.description}</p>
						<a
							href="https://twitter.com/brsc2909"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-3 rounded-full bg-blue-400 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-500"
						>
							<Twitter class="h-5 w-5" />
							<span class="font-mono">Follow @brsc2909</span>
						</a>
						<p class="mt-4 text-sm text-gray-400">Keep scrolling for more awesome projects!</p>
					</div>
				{:else}
					<!-- Regular Repository Card -->
					<!-- Top: Repository Name and Description -->
					<div class="flex-none space-y-2">
						{#if project.id === -2}
							<!-- Promoted Repository Badge -->
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="rounded-full bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 px-3 py-1 text-sm font-bold text-black">Featured Project</span>
									<Star class="h-5 w-5 text-yellow-400" />
								</div>
								<a
									href="https://github.com/BlackShoreTech/gittok.dev"
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-2 rounded-full bg-gray-800/50 px-4 py-2 text-sm text-gray-200 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
								>
									<Star class="h-4 w-4 text-yellow-400" />
									<span>Star us to get featured!</span>
								</a>
							</div>
						{/if}
						<h1 class="flex items-center gap-2 font-serif text-2xl text-white md:text-3xl {project.id === -2 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400' : ''}">
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
					<div class="my-4 flex min-h-0 flex-1">
						<div
							class="markdown-content readme-container w-full overflow-y-clip rounded-xl {project.id === -2 ? 'bg-gradient-to-br from-gray-800/30 via-gray-800/40 to-gray-800/30 shadow-lg shadow-purple-500/10' : 'bg-gray-800/30'} p-6 backdrop-blur-sm"
							use:scrollMarkdownToTop
						>
							{#if !project.readmeSnippet}
								<div class="animate-pulse text-gray-400">Loading README...</div>
							{:else}
								{@html renderMarkdown(
									project.readmeSnippet,
									`https://github.com/${project.author}/${project.name}/${project.default_branch}/`
								)}
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
								class="rounded-full {project.id === -2 ? 'bg-gradient-to-br from-gray-800/50 to-purple-800/50 shadow-lg shadow-purple-500/20' : 'bg-gray-800/50'} p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
								aria-label={`Star repository (${formatNumber(project.stars)} stars)`}
							>
								<Star class="h-8 w-8 {project.id === -2 ? 'text-yellow-300' : 'text-yellow-400'}" />
							</a>
							<span class="mt-1 font-mono text-sm text-white">{formatNumber(project.stars)}</span>
						</div>

						<!-- Watchers -->
						<div class="flex flex-col items-center">
							<div
								class="rounded-full {project.id === -2 ? 'bg-gradient-to-br from-gray-800/50 to-purple-800/50 shadow-lg shadow-purple-500/20' : 'bg-gray-800/50'} p-2 backdrop-blur-sm"
								aria-label={`${formatNumber(project.watchers)} watchers`}
							>
								<Eye class="h-8 w-8 {project.id === -2 ? 'text-blue-300' : 'text-blue-400'}" />
							</div>
							<span class="mt-1 font-mono text-sm text-white">{formatNumber(project.watchers)}</span>
						</div>
						<!-- Forks -->
						<div class="flex flex-col items-center">
							<a
								href={project.forksUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="rounded-full {project.id === -2 ? 'bg-gradient-to-br from-gray-800/50 to-purple-800/50 shadow-lg shadow-purple-500/20' : 'bg-gray-800/50'} p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
								aria-label={`Fork repository (${formatNumber(project.forks)} forks)`}
							>
								<GitFork class="h-8 w-8 {project.id === -2 ? 'text-gray-300' : 'text-gray-400'}" />
							</a>
							<span class="mt-1 font-mono text-sm text-white">{formatNumber(project.forks)}</span>
						</div>

						<!-- Share Button -->
						<div class="flex flex-col items-center">
							<button
								on:click={() => shareProject(project)}
								class="rounded-full {project.id === -2 ? 'bg-gradient-to-br from-gray-800/50 to-purple-800/50 shadow-lg shadow-purple-500/20' : 'bg-gray-800/50'} p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
								aria-label="Share repository"
							>
								<Share2 class="h-8 w-8 {project.id === -2 ? 'text-purple-300' : 'text-purple-400'}" />
							</button>
							<span class="mt-1 font-mono text-sm text-white">Share</span>
						</div>
					</div>

					<!-- Bottom: Author Info -->
					<div class="mb-4 flex flex-none items-center gap-3">
						<img
							src={project.avatar}
							alt={`${project.author}'s avatar`}
							class="h-10 w-10 rounded-full {project.id === -2 ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-black' : ''}"
						/>
						<div>
							<h2 class="font-mono text-lg text-white">{project.author}</h2>
						</div>
						<a
							href={`https://github.com/${project.author}/${project.name}`}
							target="_blank"
							rel="noopener noreferrer"
							class="ml-auto rounded-lg {project.id === -2 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30' : 'bg-white/10 hover:bg-white/20'} px-4 py-2 font-mono text-white transition-colors duration-200"
						>
							View
						</a>
					</div>
				{/if}
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
