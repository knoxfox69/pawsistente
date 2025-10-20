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
    timing: 'off' as NotificationTiming
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
      case 'off':
        return languageStore.currentLanguage === 'es' ? 'Desactivado' : 'Off';
      case '15min':
        return languageStore.currentLanguage === 'es' ? '15 minutos antes' : '15 minutes before';
      case '30min':
        return languageStore.currentLanguage === 'es' ? '30 minutos antes' : '30 minutes before';
    }
  };

  // Test notification function
  const testNotification = async () => {
    console.log('Testing notification...');
    if (notificationManager.canNotify()) {
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
      alert(languageStore.currentLanguage === 'es' 
        ? 'No se pueden enviar notificaciones. Verifica los permisos en la configuración del navegador.'
        : 'Cannot send notifications. Check browser permissions.');
    }
  };

  // Test event reminder function
  const testEventReminder = async () => {
    console.log('Testing event reminder...');
    if (notificationManager.canNotify()) {
      // Schedule a test event reminder for 5 seconds from now
      const testEventTime = new Date(Date.now() + 5000);
      notificationManager.scheduleEventReminder('Test Event', testEventTime);
      console.log('Test event reminder scheduled for 5 seconds from now');
      alert(languageStore.currentLanguage === 'es' 
        ? 'Recordatorio de evento de prueba programado para 5 segundos.'
        : 'Test event reminder scheduled for 5 seconds.');
    } else {
      console.log('Cannot send notification - permission not granted');
      alert(languageStore.currentLanguage === 'es' 
        ? 'No se pueden enviar notificaciones. Verifica los permisos en la configuración del navegador.'
        : 'Cannot send notifications. Check browser permissions.');
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
            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-transform"
          >
            {languageStore.currentLanguage === 'es' ? 'Instalar Ahora' : 'Install Now'}
          </button>
        {:else}
          <div class="text-center">
            <p class="text-gray-400 text-sm">
              {languageStore.currentLanguage === 'es' 
                ? 'La app ya está instalada o no se puede instalar en este dispositivo.'
                : 'App is already installed or cannot be installed on this device.'}
            </p>
          </div>
        {/if}
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
                {#each ['off', '15min', '30min'] as timing}
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

          <!-- Test Notifications Section -->
          {#if notificationSettings.enabled}
            <div class="mt-6 pt-4 border-t border-gray-600">
              <p class="text-gray-300 font-medium mb-3">
                {languageStore.currentLanguage === 'es' ? 'Probar Notificaciones' : 'Test Notifications'}
              </p>
              <div class="flex gap-2">
                <button
                  onclick={testNotification}
                  class="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  {languageStore.currentLanguage === 'es' ? 'Notificación de Prueba' : 'Test Notification'}
                </button>
                <button
                  onclick={testEventReminder}
                  class="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-400/30 hover:bg-green-500/30 transition-colors text-sm"
                >
                  {languageStore.currentLanguage === 'es' ? 'Recordatorio de Prueba' : 'Test Reminder'}
                </button>
              </div>
              <p class="text-gray-400 text-xs mt-2">
                {languageStore.currentLanguage === 'es' 
                  ? 'El recordatorio de prueba se enviará en 5 segundos'
                  : 'Test reminder will be sent in 5 seconds'}
              </p>
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
              ? 'Versión Beta - Confuror 2025'
              : 'Beta Version - Confuror 2025'}
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
