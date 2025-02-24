// Purpose: Functions for fetching and processing GitHub stargazer data
// Context: Used to fetch and store stargazer information and their repositories

import { Octokit } from "@octokit/rest";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { stargazers, repositories } from "../db/schema";
import { fetchUserRepositories } from "./repositories";

export async function isWithinLastDay(dateStr: string): Promise<boolean> {
  const date = new Date(dateStr);
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return date >= oneDayAgo;
}

export async function fetchRecentStargazers(octokit: Octokit, owner: string, repo: string) {
  try {
    let page = 1;
    let hasMorePages = true;
    let foundOldStar = false;

    while (hasMorePages && !foundOldStar) {
      console.log(`Fetching stargazers page ${page}...`);

      const response = await octokit.rest.activity.listStargazersForRepo({
        owner,
        repo,
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

    await printRecentStatistics();

  } catch (error) {
    console.error('Error fetching or processing stargazers:', error);
    throw error;
  }
}

export async function printRecentStatistics() {
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
} 