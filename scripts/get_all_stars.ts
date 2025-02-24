// Purpose: Fetch all GitHub users who have starred this repository and their public repos
// Context: Used to maintain a list of users who have shown interest in the project and analyze their interests

import { Octokit } from "@octokit/rest";
import { db } from "../src/lib/db";
import { eq, sql } from "drizzle-orm";
import { stargazers, repositories } from "../src/lib/db/schema";

interface GraphQLPinnedRepo {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  primaryLanguage: {
    name: string;
  } | null;
  stargazerCount: number;
  isFork: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GraphQLResponse {
  user: {
    pinnedItems: {
      nodes: GraphQLPinnedRepo[];
    };
  };
}

async function fetchPinnedRepositories(octokit: Octokit, username: string): Promise<typeof repositories.$inferSelect[]> {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                id
                name
                nameWithOwner
                description
                url
                primaryLanguage {
                  name
                }
                stargazerCount
                isFork
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `;

    const response = await octokit.graphql<GraphQLResponse>(query, { username });
    const pinnedRepos = response.user?.pinnedItems?.nodes ?? [];

    return pinnedRepos.map(repo => ({
      id: parseInt(repo.id.split(':')[1], 10),
      name: repo.name,
      full_name: repo.nameWithOwner,
      description: repo.description,
      html_url: repo.url,
      language: repo.primaryLanguage?.name ?? null,
      stargazers_count: repo.stargazerCount,
      fork: repo.isFork ? 1 : 0,
      created_at: repo.createdAt,
      updated_at: repo.updatedAt,
      is_pinned: 1,
      owner_id: 0, // This will be set later when we know the stargazer's ID
      fetched_at: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error fetching pinned repositories for ${username}:`, error);
    return [];
  }
}

async function fetchUserRepositories(octokit: Octokit, username: string): Promise<typeof repositories.$inferSelect[]> {
  try {
    const repos: typeof repositories.$inferSelect[] = [];
    let page = 1;
    let hasMorePages = true;

    // First, get pinned repositories to compare against
    const pinnedRepos = await fetchPinnedRepositories(octokit, username);
    const pinnedRepoIds = new Set(pinnedRepos.map(repo => repo.id));

    while (hasMorePages) {
      console.log(`Fetching repositories for ${username}, page ${page}...`);

      const response = await octokit.rest.repos.listForUser({
        username,
        per_page: 100,
        page: page,
        type: 'owner',
        sort: 'updated'
      });

      const filteredRepos = response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language ?? null,
        stargazers_count: repo.stargazers_count ?? 0,
        fork: repo.fork ? 1 : 0,
        created_at: repo.created_at ?? new Date().toISOString(),
        updated_at: repo.updated_at ?? new Date().toISOString(),
        is_pinned: pinnedRepoIds.has(repo.id) ? 1 : 0,
        owner_id: 0, // This will be set later when we know the stargazer's ID
        fetched_at: new Date().toISOString()
      }));

      repos.push(...filteredRepos);

      hasMorePages = response.data.length === 100;
      page++;

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return repos;
  } catch (error) {
    console.error(`Error fetching repositories for ${username}:`, error);
    return [];
  }
}

async function isWithinLastDay(dateStr: string): Promise<boolean> {
  const date = new Date(dateStr);
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return date >= oneDayAgo;
}

async function fetchAllStargazers() {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    let page = 1;
    let hasMorePages = true;
    let foundOldStar = false;

    while (hasMorePages && !foundOldStar) {
      console.log(`Fetching stargazers page ${page}...`);

      const response = await octokit.rest.activity.listStargazersForRepo({
        owner: "BlackShoreTech",
        repo: "gittok.dev",
        sort: "created",
        direction: "desc", // Get newest stars first
        per_page: 100,
        page: page
      });

      // Process each stargazer and fetch their repositories
      for (const stargazerData of response.data) {
        const user = 'user' in stargazerData ? stargazerData.user : stargazerData;
        const starredAt = 'starred_at' in stargazerData ? stargazerData.starred_at : null;
        
        if (!user || !starredAt) continue;

        // Check if this star is within the last 24 hours
        if (!await isWithinLastDay(starredAt)) {
          console.log('Found star older than 24 hours, stopping...');
          foundOldStar = true;
          break;
        }

        console.log(`Processing user ${user.login} who starred at ${starredAt}...`);

        // Check if stargazer already exists
        const existingStargazer = await db.select().from(stargazers).where(eq(stargazers.login, user.login)).get();
        
        // Create or update stargazer
        const stargazer = {
          id: user.id,
          login: user.login,
          avatar_url: user.avatar_url,
          html_url: user.html_url,
          type: user.type ?? 'User',
          starred_at: starredAt,
        };

        if (existingStargazer) {
          await db.update(stargazers)
            .set(stargazer)
            .where(eq(stargazers.id, user.id))
            .run();
        } else {
          await db.insert(stargazers).values(stargazer).run();
        }

        // Fetch and store repositories
        const userRepos = await fetchUserRepositories(octokit, user.login);
        
        // Set owner_id for all repositories
        const reposWithOwner = userRepos.map(repo => ({
          ...repo,
          owner_id: user.id
        }));

        // Upsert repositories
        for (const repo of reposWithOwner) {
          const existingRepo = await db.select().from(repositories).where(eq(repositories.id, repo.id)).get();
          
          if (existingRepo) {
            await db.update(repositories)
              .set(repo)
              .where(eq(repositories.id, repo.id))
              .run();
          } else {
            await db.insert(repositories).values(repo).run();
          }
        }
      }

      // Check if we've reached the last page
      hasMorePages = response.data.length === 100 && !foundOldStar;
      page++;

      // GitHub API has rate limiting, so let's add a small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Print statistics for the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentStargazers = await db.select({ count: sql<number>`count(*)` })
      .from(stargazers)
      .where(sql`starred_at >= ${oneDayAgo}`)
      .get();

    const recentStargazerIds = await db.select({ id: stargazers.id })
      .from(stargazers)
      .where(sql`starred_at >= ${oneDayAgo}`);

    const recentRepos = await db.select({ count: sql<number>`count(*)` })
      .from(repositories)
      .where(sql`owner_id IN ${recentStargazerIds.map(s => s.id)}`)
      .get();

    const recentPinnedRepos = await db.select({ count: sql<number>`count(*)` })
      .from(repositories)
      .where(sql`owner_id IN ${recentStargazerIds.map(s => s.id)} AND is_pinned = 1`)
      .get();

    console.log(`
    Statistics for the last 24 hours:
    - New stargazers: ${recentStargazers?.count ?? 0}
    - Their repositories: ${recentRepos?.count ?? 0}
    - Their pinned repositories: ${recentPinnedRepos?.count ?? 0}
    - Average repositories per new stargazer: ${((recentRepos?.count ?? 0) / (recentStargazers?.count ?? 1)).toFixed(2)}
        `);

  } catch (error) {
    console.error('Error fetching or processing stargazers:', error);
    process.exit(1);
  }
}

fetchAllStargazers();