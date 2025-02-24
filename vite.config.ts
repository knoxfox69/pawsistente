import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { promises as fs } from 'fs';
import * as path from 'path';
import tailwindcss from '@tailwindcss/vite';
import mkcert from 'vite-plugin-mkcert';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		mkcert(),
		{
			name: 'copy-sql-wasm',
			configureServer(server) {
				// Copy SQL.js files to public directory in development
				server.middlewares.use(async (req, res, next) => {
					if (req.url?.startsWith('/sql.js-httpvfs/')) {
						const file = req.url.replace('/sql.js-httpvfs/', '');
						const filePath = resolve(__dirname, 'node_modules/sql.js-httpvfs/dist', file);
						try {
							await server.ssrLoadModule(filePath);
							return res.end();
						} catch {
							next();
						}
					}
					next();
				});
			},
			async writeBundle() {
				// Copy SQL.js files to build directory in production
				const sourceDir = resolve(__dirname, 'node_modules/sql.js-httpvfs/dist');
				const targetDir = resolve(__dirname, '.svelte-kit/output/client/sql.js-httpvfs');
				
				await fs.mkdir(targetDir, { recursive: true });
				
				for (const file of ['sqlite.worker.js', 'sql-wasm.wasm']) {
					await fs.copyFile(
						path.join(sourceDir, file),
						path.join(targetDir, file)
					);
				}
			}
		}
	],
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],

				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
