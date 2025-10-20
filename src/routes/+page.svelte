<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { languageStore, APP_VERSION } from '$lib/stores/language';
  import { PWAManager } from '$lib/utils/pwa';
  import { NotificationManager } from '$lib/utils/notifications';
  import Header from '$lib/components/Header.svelte';
  import { Download, X } from 'lucide-svelte';

  let hasVisited = $state(false);
  let visible = $state(false);
  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);
  let showInstallPrompt = $state(false);
  let canInstall = $state(false);

  // Language store subscription
  let unsubscribe: (() => void) | undefined;
  let pwaManager: PWAManager;
  let notificationManager: NotificationManager;

  onMount(() => {
    hasVisited = localStorage.getItem('hasVisitedPawsistente') === 'true';
    visible = true;
    languageStore.loadFromStorage();
    
    unsubscribe = languageStore.subscribe(() => {
      t = languageStore.translations;
      currentLanguage = languageStore.currentLanguage;
    });

    // Initialize PWA manager
    pwaManager = PWAManager.getInstance();
    pwaManager.initialize();
    
    // Set up install prompt callback
    pwaManager.setInstallPromptCallback(() => {
      canInstall = true;
      // Show install prompt if user hasn't dismissed it and hasn't seen it before
      if (!localStorage.getItem('installPromptDismissed') && !localStorage.getItem('hasSeenInstallPrompt')) {
        setTimeout(() => {
          showInstallPrompt = true;
          localStorage.setItem('hasSeenInstallPrompt', 'true');
        }, 2000);
      }
    });

    // Initialize notification manager
    notificationManager = NotificationManager.getInstance();
    notificationManager.initialize();
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  const handleInstall = async () => {
    const success = await pwaManager.promptInstall();
    if (success) {
      showInstallPrompt = false;
      canInstall = false;
    }
  };

  const dismissInstallPrompt = () => {
    showInstallPrompt = false;
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Test notification function
  const testNotification = async () => {
    console.log('Testing notification...');
    if (notificationManager?.canNotify()) {
      await notificationManager.sendNotification(
        'Test Notification',
        {
          body: 'This is a test notification from Pawsistente!',
          icon: '/android-chrome-192x192.png',
          tag: 'test-notification'
        }
      );
      console.log('Test notification sent');
    } else {
      console.log('Cannot send notification - permission not granted');
      alert(currentLanguage === 'es' 
        ? 'No se pueden enviar notificaciones. Ve a Configuración para habilitarlas.'
        : 'Cannot send notifications. Go to Settings to enable them.');
    }
  };
</script>

<div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-black">

  <!-- Animated background elements -->
  <div class="absolute inset-0 overflow-hidden">
    {#each Array(20) as _, i}
      <div
        class="absolute rounded-full mix-blend-screen animate-float"
        style="
          left: {Math.random() * 100}%;
          top: {Math.random() * 100}%;
          width: {Math.random() * 300 + 50}px;
          height: {Math.random() * 300 + 50}px;
          background: radial-gradient(circle at center,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(59, 130, 246, 0) 70%);
          animation-delay: -{Math.random() * 5}s;
          animation-duration: {Math.random() * 10 + 15}s;
        "
      >
      </div>
    {/each}
  </div>


  <div class="relative min-h-screen flex flex-col items-center justify-start p-6">

    {#if visible}
      <!-- Decorative elements -->
      <div class="absolute top-32 left-8 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
      <div class="absolute top-40 right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-lg animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute bottom-32 left-16 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 2s;"></div>
      
      <div
        class="glass-card text-center p-8 max-w-md w-full relative z-10"
        in:fly={{ y: 50, duration: 1000 }}
      >

        <!-- Header without back button -->
        <Header 
          showBackButton={false} 
          padding="sm"
          anchored={false}
          sticky={true}
          overlay={true}
          glassmorphic={false}
          showSeparator={false}
          showBackground={false}
          showOutline={false}
          bottomPadding=""
          className="mb-2"
        />
        <div in:fade={{ delay: 200, duration: 800 }}>
          <img 
            src="/icons/logo.svg" 
            alt="Pawsistente Logo" 
            class="w-24 h-24 mx-auto mb-4"
          />
          <h1 class="text-5xl font-sans mb-2 text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Pawsistente
          </h1>
          <p class="text-xl text-gray-300 mb-8">{t.appSubtitle}</p>

          <!-- Disclaimer -->
          <div class="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <p class="text-yellow-400 text-sm font-mono">
              ⚠️ {currentLanguage === 'es' ? 'Esta no es una aplicación oficial de Confuror' : 'This is not an official Confuror application'}
            </p>
          </div>

          <div class="space-y-6 text-gray-300 font-sans">
            <p
              class="text-sm text-gray-400 mt-6 italic"
              in:fade={{ delay: 800, duration: 800 }}
            >
              {currentLanguage === 'es' 
                ? 'Perfecto para furros asistiendo a Confuror 2025. ¡Desliza, selecciona y genera tu calendario!'
                : 'Perfect for furries attending Confuror 2025. Swipe, select and generate your calendar!'
              }
            </p>
            
            <!-- Feature highlights -->
          </div>

          <div class="flex flex-col items-center gap-4 mt-6">
            <a
              href="/events"
              class="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              in:fade={{ delay: 1000, duration: 800 }}
            >
              {currentLanguage === 'es' ? 'Añadir eventos' : 'Add events'}
            </a>
            
            <a
              href="/schedule"
              class="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
              in:fade={{ delay: 1100, duration: 800 }}
            >
              {currentLanguage === 'es' ? 'Ver mi horario' : 'View my schedule'}
            </a>

            <a
              href="/settings"
              class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              in:fade={{ delay: 1150, duration: 800 }}
            >
              {currentLanguage === 'es' ? 'Configuración' : 'Settings'}
            </a>

            <div class="h-2"></div>
            
            <a
              href="/about"
              class="px-6 py-3 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors"
              in:fade={{ delay: 1200, duration: 800 }}
            >
              {t.about}
            </a>

            <!-- Notification Test Button -->
            <button
              onclick={testNotification}
              class="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-400/30 hover:bg-green-500/30 transition-colors text-sm"
              in:fade={{ delay: 1300, duration: 800 }}
            >
              {currentLanguage === 'es' ? 'Probar Notificación' : 'Test Notification'}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- PWA Install Prompt -->
  {#if showInstallPrompt}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" in:fade={{ duration: 500 }}>
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-lg mx-4" in:scale={{ duration: 600 }}>
        <div class="flex justify-end mb-4">
          <button
            onclick={dismissInstallPrompt}
            class="text-gray-400 hover:text-white transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
        
        <div class="text-6xl mb-6">📱</div>
        <h3 class="text-2xl font-serif text-white mb-6">
          {currentLanguage === 'es' ? '¡Instala Pawsistente!' : 'Install Pawsistente!'}
        </h3>
        <p class="text-gray-300 mb-6">
          {currentLanguage === 'es' 
            ? 'Instala la app en tu dispositivo para una mejor experiencia, acceso offline y notificaciones de eventos.'
            : 'Install the app on your device for a better experience, offline access, and event notifications.'}
        </p>
        
        <!-- Manual Install Instructions -->
        <div class="bg-gray-700/30 rounded-lg p-4 mb-6 text-left">
          <h4 class="text-white font-medium mb-2">
            {currentLanguage === 'es' ? 'Instrucciones de instalación:' : 'Installation instructions:'}
          </h4>
          <div class="text-sm text-gray-300 space-y-2">
            <p><strong>Chrome:</strong> {currentLanguage === 'es' ? 'Toca el menú (⋮) → "Instalar app"' : 'Tap menu (⋮) → "Install app"'}</p>
            <p><strong>Samsung Browser:</strong> {currentLanguage === 'es' ? 'Toca el menú (⋮) → "Añadir a pantalla de inicio"' : 'Tap menu (⋮) → "Add to Home screen"'}</p>
            <p><strong>Firefox:</strong> {currentLanguage === 'es' ? 'Toca el menú (⋮) → "Instalar"' : 'Tap menu (⋮) → "Install"'}</p>
          </div>
        </div>
        
        <div class="flex gap-4 justify-center">
          <button
            onclick={dismissInstallPrompt}
            class="px-6 py-3 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors"
          >
            {currentLanguage === 'es' ? 'Ahora no' : 'Not now'}
          </button>
          <button
            onclick={handleInstall}
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            {currentLanguage === 'es' ? 'Instalar' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  .glass-card {
    background: rgba(31, 41, 55, 0.3);
    backdrop-filter: blur(12px);
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-20px) scale(1.1);
    }
  }

  .animate-float {
    animation: float linear infinite;
  }

  /* Add hover effects to the glass card */
  .glass-card:hover {
    background: rgba(31, 41, 55, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }
</style>
