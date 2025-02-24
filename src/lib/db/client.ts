// Purpose: Client-side SQLite database access using sql.js-httpvfs
// Context: Provides functions to query and filter stargazers and repositories data over HTTP

import { createDbWorker } from 'sql.js-httpvfs';
import type { Repository, Stargazer, QueryParams } from '$lib/db/types';

// Worker configuration for sql.js-httpvfs
const workerConfig = {
    from: 'cdn' as const,
    wasmUrl: 'https://cdn.jsdelivr.net/npm/sql.js-httpvfs@0.1.0/dist/sql-wasm.wasm'
};

let worker: Awaited<ReturnType<typeof createDbWorker>> | null = null;

/**
 * Initialize the database connection
 */
export async function initDatabase(dbUrl: string) {
    if (!worker) {
        worker = await createDbWorker(
            [{
                from: 'inline' as const,
                config: {
                    serverMode: 'full' as const,
                    url: dbUrl,
                    requestChunkSize: 4096
                }
            }],
            workerConfig.wasmUrl,
            '/sql.js-httpvfs/sqlite.worker.js'
        );
    }
    return worker;
}

/**
 * Execute a query with parameters
 */
async function executeQuery<T>(query: string, params: QueryParams[] = []): Promise<T[]> {
    if (!worker) throw new Error('Database not initialized');
    const result = await worker.db.query(query, params);
    return result as T[];
}

/**
 * Get all stargazers with optional filtering
 */
export async function getStargazers({
    limit = 50,
    offset = 0,
    type = '',
    orderBy = 'starred_at',
    order = 'desc'
}: {
    limit?: number;
    offset?: number;
    type?: string;
    orderBy?: 'starred_at' | 'created_at' | 'updated_at' | 'login';
    order?: 'asc' | 'desc';
} = {}): Promise<Stargazer[]> {
    let query = 'SELECT * FROM stargazers';
    const params: QueryParams[] = [];

    if (type) {
        query += ' WHERE type = ?';
        params.push(type);
    }

    query += ` ORDER BY ${orderBy} ${order}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await executeQuery<Stargazer>(query, params);
}

/**
 * Get a single stargazer by ID
 */
export async function getStargazerById(id: number): Promise<Stargazer | null> {
    const result = await executeQuery<Stargazer>(
        'SELECT * FROM stargazers WHERE id = ? LIMIT 1',
        [id]
    );
    return result[0] || null;
}

/**
 * Get repositories with optional filtering
 */
export async function getRepositories({
    limit = 50,
    offset = 0,
    language = '',
    ownerId = 0,
    isPinned = null,
    minStars = 0,
    orderBy = 'stargazers_count',
    order = 'desc'
}: {
    limit?: number;
    offset?: number;
    language?: string;
    ownerId?: number;
    isPinned?: boolean | null;
    minStars?: number;
    orderBy?: 'stargazers_count' | 'created_at' | 'updated_at' | 'name';
    order?: 'asc' | 'desc';
} = {}): Promise<Repository[]> {
    let query = 'SELECT * FROM repositories WHERE 1=1';
    const params: QueryParams[] = [];

    if (language) {
        query += ' AND language = ?';
        params.push(language);
    }

    if (ownerId) {
        query += ' AND owner_id = ?';
        params.push(ownerId);
    }

    if (isPinned !== null) {
        query += ' AND is_pinned = ?';
        params.push(isPinned ? 1 : 0);
    }

    if (minStars > 0) {
        query += ' AND stargazers_count >= ?';
        params.push(minStars);
    }

    query += ` ORDER BY ${orderBy} ${order}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await executeQuery<Repository>(query, params);
}

interface DbCounts {
    total: number;
    pinned: number;
    avgStars: number;
}

interface LanguageCount {
    language: string;
    count: number;
}

/**
 * Get repository statistics
 */
export async function getRepositoryStats(): Promise<{
    totalRepos: number;
    totalPinnedRepos: number;
    avgStarsPerRepo: number;
    topLanguages: LanguageCount[];
}> {
    const [counts] = await executeQuery<DbCounts>(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END) as pinned,
            AVG(stargazers_count) as avgStars
        FROM repositories
    `);

    const languages = await executeQuery<LanguageCount>(`
        SELECT language, COUNT(*) as count 
        FROM repositories 
        WHERE language IS NOT NULL 
        GROUP BY language 
        ORDER BY count DESC 
        LIMIT 10
    `);

    return {
        totalRepos: counts.total,
        totalPinnedRepos: counts.pinned,
        avgStarsPerRepo: counts.avgStars,
        topLanguages: languages
    };
}

/**
 * Search repositories by name or description
 */
export async function searchRepositories(
    query: string,
    {
        limit = 50,
        offset = 0
    }: {
        limit?: number;
        offset?: number;
    } = {}
): Promise<Repository[]> {
    const searchQuery = `%${query}%`;
    return await executeQuery<Repository>(
        `SELECT * FROM repositories 
         WHERE name LIKE ? OR description LIKE ?
         ORDER BY stargazers_count DESC
         LIMIT ? OFFSET ?`,
        [searchQuery, searchQuery, limit, offset]
    );
}

/**
 * Get repositories for a specific time period
 */
export async function getRecentRepositories(
    days: number = 7,
    {
        limit = 50,
        offset = 0
    }: {
        limit?: number;
        offset?: number;
    } = {}
): Promise<Repository[]> {
    return await executeQuery<Repository>(
        `SELECT * FROM repositories 
         WHERE created_at >= datetime('now', ?) 
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [`-${days} days`, limit, offset]
    );
}