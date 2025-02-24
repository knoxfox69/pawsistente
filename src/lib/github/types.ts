// Purpose: Type definitions for GitHub API responses and data structures
// Context: Used to type GitHub API interactions and data processing

import type { repositories } from '../db/schema';

export interface GraphQLPinnedRepo {
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

export interface GraphQLResponse {
  user: {
    pinnedItems: {
      nodes: GraphQLPinnedRepo[];
    };
  };
}

export type Repository = typeof repositories.$inferSelect; 