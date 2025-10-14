<!--
  Purpose: About page with project information and version details
  Context: Provides information about the Confuror Calendar application
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { ArrowLeft, Calendar, Heart, Code, Users, Download } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';

  let t = $derived(languageStore.translations);
  let version = '0.1.0-alpha';

  onMount(() => {
    languageStore.loadFromStorage();
  });

  let features = $derived([
    {
      icon: Calendar,
      title: t.appTitle,
      description: t.projectDescription
    },
    {
      icon: Code,
      title: 'Tecnología',
      description: 'Construido con SvelteKit 5, TypeScript, y Tailwind CSS para una experiencia moderna y rápida.'
    },
    {
      icon: Users,
      title: 'Comunidad',
      description: 'Diseñado específicamente para la comunidad furry mexicana asistiendo a Confuror 2024.'
    },
    {
      icon: Download,
      title: 'Integración',
      description: 'Exporta tu horario a Google Calendar, Apple Calendar o cualquier aplicación compatible con iCal.'
    }
  ]);
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8" in:fade={{ duration: 800 }}>
      <a
        href="/events"
        class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
        aria-label="Back to events"
      >
        <ArrowLeft class="h-6 w-6 text-gray-400" />
      </a>
      <div>
        <h1 class="text-4xl font-serif text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t.about} 🐾 Pawsistente</h1>
        <p class="text-gray-400 font-mono text-sm">{t.version} {version}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-8">
      <!-- Project Description -->
      <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8" in:scale={{ duration: 600, delay: 200 }}>
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-blue-400/20 rounded-full flex items-center justify-center">
            <Calendar class="w-6 h-6 text-blue-400" />
          </div>
          <h2 class="text-2xl font-serif text-white">🐾 Pawsistente - Confuror Calendar</h2>
        </div>
        <p class="text-lg text-gray-300 font-serif leading-relaxed mb-4">
          {t.projectDescription}
        </p>
        <p class="text-gray-400 font-mono text-sm">
          {t.madeFor}
        </p>
        
        <!-- Disclaimer -->
        <div class="mt-6 pt-6 border-t border-gray-700">
          <div class="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-4">
            <p class="text-yellow-400 text-sm font-mono text-center">
              ⚠️ Esta no es una aplicación oficial de Confuror
            </p>
          </div>
        </div>

        <!-- Contact Section -->
        <div class="mt-6 pt-6 border-t border-gray-700">
          <h3 class="text-lg font-serif text-white mb-4 text-center">Contacto / Contact</h3>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://t.me/knoxfox69"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform"
            >
              <span class="text-xl">📱</span>
              <span>@knoxfox69</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-2 gap-6">
        {#each features as feature, index}
          <div 
            class="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            in:scale={{ duration: 400, delay: 300 + index * 100 }}
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon class="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 class="text-xl font-serif text-white mb-2">{feature.title}</h3>
                <p class="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Technical Details -->
      <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8" in:scale={{ duration: 600, delay: 800 }}>
        <h3 class="text-xl font-serif text-white mb-6 flex items-center gap-3">
          <Code class="w-6 h-6 text-blue-400" />
          Detalles Técnicos
        </h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-mono text-blue-400 mb-2">Frontend</h4>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• SvelteKit 5 con Runes</li>
              <li>• TypeScript para type safety</li>
              <li>• Tailwind CSS para estilos</li>
              <li>• Lucide Svelte para iconos</li>
            </ul>
          </div>
          <div>
            <h4 class="font-mono text-blue-400 mb-2">Backend & Deploy</h4>
            <ul class="text-gray-300 text-sm space-y-1">
              <li>• Docker Compose</li>
              <li>• MongoDB para datos</li>
              <li>• iCal export estándar</li>
              <li>• Responsive design</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="text-center" in:fade={{ duration: 600, delay: 1000 }}>
        <a
          href="/events"
          class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <Calendar class="w-5 h-5" />
          {t.browseEvents}
        </a>
      </div>
    </div>
  </div>
</div>