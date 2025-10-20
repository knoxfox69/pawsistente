<!-- Purpose: Settings page with notification preferences and app management
     Context: Centralized settings for PWA and notification configuration -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { RotateCcw, Download, Bell, BellOff, Settings as SettingsIcon } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';
  import { appState } from '$lib/stores/appState';
  import { goto } from '$app/navigation';
  import { PWAManager } from '$lib/utils/pwa';
  import { NotificationManager, type NotificationTiming } from '$lib/utils/notifications';
  import Header from '$lib/components/Header.svelte';

  let t = $derived(languageStore.translations);
  let showResetConfirm = $state(false);
  let canInstall = $state(false);
  let notificationSettings = $state({
    enabled: false,
    timing: '15min' as NotificationTiming
  });

  let pwaManager: PWAManager;
  let notificationManager: NotificationManager;

  onMount(() => {
    languageStore.loadFromStorage();
    
    // Initialize PWA manager
    pwaManager = PWAManager.getInstance();
    pwaManager.initialize();
    
    // Set up install prompt callback
    pwaManager.setInstallPromptCallback(() => {
      console.log('Settings: Install prompt callback triggered');
      canInstall = true;
    });
    
    // Check current install status
    setTimeout(() => {
      canInstall = pwaManager.canInstall();
      console.log('Settings: Initial canInstall check:', canInstall);
    }, 1000);

    // Initialize notification manager
    notificationManager = NotificationManager.getInstance();
    notificationManager.initialize().then(() => {
      notificationSettings = notificationManager.getSettings();
    });
  });

  const handleReset = () => {
    showResetConfirm = true;
  };

  const confirmReset = () => {
    appState.clearState();
    localStorage.removeItem('manually-added-events');
    showResetConfirm = false;
    goto('/');
  };

  const cancelReset = () => {
    showResetConfirm = false;
  };

  const handleInstall = async () => {
    const success = await pwaManager.promptInstall();
    if (success) {
      canInstall = false;
    }
  };

  const updateNotificationTiming = (timing: NotificationTiming) => {
    notificationSettings.timing = timing;
    notificationManager.updateSettings({ timing });
  };

  const toggleNotifications = async () => {
    if (!notificationSettings.enabled) {
      // Request permission when enabling
      const success = await notificationManager.requestPermission();
      if (success) {
        notificationSettings.enabled = true;
        notificationManager.updateSettings({ enabled: true });
      }
    } else {
      // Disable notifications
      notificationSettings.enabled = false;
      notificationManager.updateSettings({ enabled: false });
    }
  };

  const getTimingLabel = (timing: NotificationTiming) => {
    switch (timing) {
      case '15min':
        return languageStore.currentLanguage === 'es' ? '15 minutos antes' : '15 minutes before';
      case '30min':
        return languageStore.currentLanguage === 'es' ? '30 minutos antes' : '30 minutes before';
      case '60min':
        return languageStore.currentLanguage === 'es' ? '60 minutos antes' : '60 minutes before';
    }
  };

</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black">
  <Header 
    title={languageStore.currentLanguage === 'es' ? 'Configuración' : 'Settings'}
    showVersion={true}
    padding="sm"
  />
  
  <div class="max-w-4xl mx-auto p-6">
    <div class="space-y-8">

      <!-- PWA Installation Section -->
      <div class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30" in:scale={{ duration: 600, delay: 200 }}>
        <div class="flex items-center gap-3 mb-4">
          <Download class="w-6 h-6 text-blue-400" />
          <h2 class="text-xl font-serif text-white">
            {languageStore.currentLanguage === 'es' ? 'Instalar App' : 'Install App'}
          </h2>
        </div>
        <p class="text-gray-300 mb-4">
          {languageStore.currentLanguage === 'es' 
            ? 'Instala Pawsistente en tu dispositivo para una mejor experiencia y acceso offline.'
            : 'Install Pawsistente on your device for a better experience and offline access.'}
        </p>
        {#if canInstall}
          <button
            onclick={handleInstall}
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-transform mb-4"
          >
            {languageStore.currentLanguage === 'es' ? 'Instalar Ahora' : 'Install Now'}
          </button>
        {:else}
          <div class="text-center mb-4">
          </div>
        {/if}

        <!-- Manual Install Instructions -->
        <div class="bg-gray-700/30 rounded-lg p-4">
          <h4 class="text-white font-medium mb-3">
            {languageStore.currentLanguage === 'es' ? 'Instrucciones de instalación manual:' : 'Manual installation instructions:'}
          </h4>
          <div class="text-sm text-gray-300 space-y-3">
            <div>
              <p class="font-medium text-gray-200 mb-1">📱 <strong>Android (Chrome/Samsung/Edge):</strong></p>
              <p>{languageStore.currentLanguage === 'es' ? 'Toca el menú (⋮) → "Instalar app" o "Añadir a pantalla de inicio"' : 'Tap menu (⋮) → "Install app" or "Add to Home screen"'}</p>
            </div>
            <div>
              <p class="font-medium text-gray-200 mb-1">💻 <strong>Desktop (Chrome/Edge):</strong></p>
              <p>{languageStore.currentLanguage === 'es' ? 'Toca el icono de instalación en la barra de direcciones o menú (⋮) → "Instalar app"' : 'Tap install icon in address bar or menu (⋮) → "Install app"'}</p>
            </div>
            <div>
              <p class="font-medium text-gray-200 mb-1">🍎 <strong>iOS (Safari):</strong></p>
              <p>{languageStore.currentLanguage === 'es' ? 'Toca el botón Compartir (□↑) → "Añadir a pantalla de inicio"' : 'Tap Share button (□↑) → "Add to Home Screen"'}</p>
            </div>
            <div>
              <p class="font-medium text-gray-200 mb-1">🦊 <strong>Firefox:</strong></p>
              <p>{languageStore.currentLanguage === 'es' ? 'Solo funciona en móviles: menú (⋮) → "Instalar"' : 'Mobile only: menu (⋮) → "Install"'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Section -->
      <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6" in:scale={{ duration: 600, delay: 400 }}>
        <div class="flex items-center gap-3 mb-4">
          {#if notificationSettings.enabled}
            <Bell class="w-6 h-6 text-green-400" />
          {:else}
            <BellOff class="w-6 h-6 text-gray-400" />
          {/if}
          <h2 class="text-xl font-serif text-white">
            {languageStore.currentLanguage === 'es' ? 'Notificaciones' : 'Notifications'}
          </h2>
        </div>
        
        <div class="space-y-4">
          <!-- Enable/Disable Notifications -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-300 font-medium">
                {languageStore.currentLanguage === 'es' ? 'Activar notificaciones' : 'Enable notifications'}
              </p>
              <p class="text-gray-400 text-sm">
                {languageStore.currentLanguage === 'es' 
                  ? 'Recibe recordatorios de eventos'
                  : 'Receive event reminders'}
              </p>
            </div>
          <button
            onclick={toggleNotifications}
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {notificationSettings.enabled ? 'bg-green-500' : 'bg-gray-600'}"
            aria-label={languageStore.currentLanguage === 'es' ? 'Activar notificaciones' : 'Enable notifications'}
          >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {notificationSettings.enabled ? 'translate-x-6' : 'translate-x-1'}"></span>
            </button>
          </div>

          <!-- Notification Timing -->
          {#if notificationSettings.enabled}
            <div class="space-y-3">
              <p class="text-gray-300 font-medium">
                {languageStore.currentLanguage === 'es' ? 'Recordar eventos' : 'Remind me'}
              </p>
              <div class="space-y-2">
                {#each ['15min', '30min', '60min'] as timing}
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      bind:group={notificationSettings.timing}
                      value={timing}
                      onchange={() => updateNotificationTiming(timing as NotificationTiming)}
                      class="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500"
                    />
                    <span class="text-gray-300">{getTimingLabel(timing as NotificationTiming)}</span>
                  </label>
                {/each}
              </div>
            </div>
          {/if}

        </div>
      </div>

      <!-- App Management Section -->
      <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6" in:scale={{ duration: 600, delay: 600 }}>
        <div class="flex items-center gap-3 mb-4">
          <SettingsIcon class="w-6 h-6 text-yellow-400" />
          <h2 class="text-xl font-serif text-white">
            {languageStore.currentLanguage === 'es' ? 'Gestión de App' : 'App Management'}
          </h2>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-300 font-medium">
                {languageStore.currentLanguage === 'es' ? 'Resetear Progreso' : 'Reset Progress'}
              </p>
              <p class="text-gray-400 text-sm">
                {languageStore.currentLanguage === 'es' 
                  ? 'Elimina todos los eventos seleccionados y progreso guardado'
                  : 'Remove all selected events and saved progress'}
              </p>
            </div>
            <button
              onclick={handleReset}
              class="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-400/30 hover:bg-red-500/30 transition-colors"
            >
              <RotateCcw class="w-4 h-4" />
              <span>{languageStore.currentLanguage === 'es' ? 'Resetear' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- App Info Section -->
      <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6" in:scale={{ duration: 600, delay: 800 }}>
        <div class="text-center">
          <img 
            src="/icons/logo.svg" 
            alt="Pawsistente Logo" 
            class="w-16 h-16 mx-auto mb-4"
          />
          <h3 class="text-lg font-serif text-white mb-2">Pawsistente</h3>
          <p class="text-gray-400 text-sm mb-4">
            {languageStore.currentLanguage === 'es' 
              ? 'Prod - Confuror 2025'
              : 'Prod - Confuror 2025'}
          </p>
          <div class="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
            <p class="text-yellow-400 text-xs font-mono">
              ⚠️ {languageStore.currentLanguage === 'es' 
                ? 'Esta no es una aplicación oficial de Confuror'
                : 'This is not an official Confuror application'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reset Confirmation Dialog -->
  {#if showResetConfirm}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" in:fade={{ duration: 500 }}>
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-lg mx-4" in:scale={{ duration: 600 }}>
        <div class="text-6xl mb-6">⚠️</div>
        <h3 class="text-2xl font-serif text-white mb-6">
          {languageStore.currentLanguage === 'es' ? '¿Resetear Progreso?' : 'Reset Progress?'}
        </h3>
        <p class="text-gray-300 mb-8">
          {languageStore.currentLanguage === 'es' 
            ? 'Esto eliminará todos tus eventos seleccionados y progreso guardado. Esta acción no se puede deshacer.'
            : 'This will remove all your selected events and saved progress. This action cannot be undone.'}
        </p>
        <div class="flex gap-4 justify-center">
          <button
            onclick={cancelReset}
            class="px-6 py-3 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors"
          >
            {languageStore.currentLanguage === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            onclick={confirmReset}
            class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
          >
            {languageStore.currentLanguage === 'es' ? 'Resetear' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
