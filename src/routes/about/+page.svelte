<!--
  Purpose: About page with information about the creator and relevant links
  Context: Created to provide information about the developer and link to their online presence
-->

<script lang="ts">
  import { Globe, Twitter, Sparkles } from 'lucide-svelte';
</script>

<div class="min-h-screen w-full bg-gradient-to-b from-gray-900 to-black">
  <div class="mx-auto max-w-3xl px-6 py-16">
    <div class="rounded-2xl bg-gray-800/30 p-8 backdrop-blur-sm">
      <h1 class="mb-6 font-serif text-4xl text-white">About GitTok</h1>

      <p class="mb-8 font-serif text-lg text-gray-200">
        GitTok is a TikTok-style interface for discovering interesting GitHub repositories.
        Scroll through projects, read their READMEs, and find your next favorite open source project.
      </p>

      <h2 class="mb-4 font-serif text-2xl text-white">Creator</h2>

      <div class="space-y-8">
        <p class="font-serif text-lg text-gray-200">
          Built by Brendan Scullion, a caffeine-powered developer who thought scrolling through GitHub could be as addictive as TikTok.
        </p>

        <div class="space-y-4">
          <h3 class="font-serif text-xl text-white">Other Cool Projects</h3>
          <a
            href="https://coso.ai"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-lg bg-gray-700/50 px-4 py-3 text-white transition-colors hover:bg-gray-600/50"
          >
            <Sparkles class="h-5 w-5 text-yellow-400" />
            <span class="font-mono">coso.ai</span>
            <span class="ml-2 text-sm text-gray-300">- AI-powered development tools</span>
          </a>
        </div>

        <div class="space-y-4">
          <h3 class="font-serif text-xl text-white">Find Me Online</h3>
          <div class="flex flex-col gap-4">
            <a
              href="https://brendanscullion.com"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-lg bg-gray-700/50 px-4 py-3 text-white transition-colors hover:bg-gray-600/50"
            >
              <Globe class="h-5 w-5 text-blue-400" />
              <span class="font-mono">brendanscullion.com</span>
            </a>

            <a
              href="https://twitter.com/brsc2909"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-lg bg-gray-700/50 px-4 py-3 text-white transition-colors hover:bg-gray-600/50"
            >
              <Twitter class="h-5 w-5 text-blue-400" />
              <span class="font-mono">@brsc2909</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>