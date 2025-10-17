<!--
  Purpose: Modular header component for all pages with configurable back button and additional icons
  Context: Reusable header that provides consistent navigation and controls across the application
  
  Positioning Modes:
  - anchored=true, sticky=false: Normal flow header that pushes content down
  - anchored=true, sticky=true: Sticky header that scrolls with content but stays at top when scrolling
  - anchored=false, overlay=false: Fixed/absolute header that overlays content (pushes down with spacer)
  - anchored=false, overlay=true: Fixed/absolute header that overlays content without pushing down
  
  Styling Options:
  - showBackground: Controls background visibility (default: true)
  - showOutline: Controls border/outline visibility (default: true)
  - glassmorphic: Enables glassmorphic card styling (default: false)
  - showSeparator: Controls bottom border (default: true)
  - bottomPadding: Custom bottom padding class (e.g., "pb-4", "mb-2") (default: "")
  
  Default: anchored=true, sticky=false, overlay=false (normal flow, pushes content down)
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { ArrowLeft } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { languageStore, APP_VERSION } from '$lib/stores/language';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';

  interface HeaderProps {
    // Main configuration
    showBackButton?: boolean;
    showLanguageSelector?: boolean;
    title?: string;
    subtitle?: string;
    showVersion?: boolean;
    
    // Back button behavior
    backHref?: string;
    backLabel?: string;
    
    // Layout and positioning
    sticky?: boolean;
    anchored?: boolean;
    overlay?: boolean;
    className?: string;
    
    // Styling and spacing
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    bottomPadding?: string;
    showSeparator?: boolean;
    glassmorphic?: boolean;
    showBackground?: boolean;
    showOutline?: boolean;
    
    // State-based styling
    currentState?: 'day-selection' | 'event-browsing' | 'summary';
    
    // Children slots
    left?: any;
    center?: any;
    right?: any;
  }

  let {
    showBackButton = true,
    showLanguageSelector = true,
    title = '',
    subtitle = '',
    showVersion = false,
    backHref,
    backLabel,
    sticky = false,
    anchored = true,
    overlay = true,
    className = '',
    padding = 'md',
    bottomPadding = '',
    showSeparator = true,
    glassmorphic = false,
    showBackground = true,
    showOutline = true,
    currentState,
    left,
    center,
    right
  }: HeaderProps = $props();

  let t = $derived(languageStore.translations);
  let currentLanguage = $derived(languageStore.currentLanguage);

  onMount(() => {
    languageStore.loadFromStorage();
  });

  const handleBackClick = () => {
    if (backHref) {
      goto(backHref);
    } else {
      // Default back behavior - prefer true browser back if possible
      if (window.history.length > 2) {
        window.history.back();
      } else {
        // Check if referrer is same-site and /events, else default to landing
        const ref = document.referrer;
        if (ref && ref.includes('/events')) {
          goto('/events');
        } else {
          goto('/');
        }
      }
    }
  };

  const getBackLabel = () => {
    if (backLabel) return backLabel;
    return currentLanguage === 'es' ? 'Regresar' : 'Go back';
  };

  // Get padding classes based on padding prop
  const getPaddingClass = () => {
    switch (padding) {
      case 'none': return 'p-0';
      case 'sm': return 'px-4 py-2';
      case 'md': return 'px-6 py-4';
      case 'lg': return 'px-8 py-6';
      case 'xl': return 'px-12 py-8';
      default: return 'px-6 py-4';
    }
  };

  // Get glassmorphic styling
  const getGlassmorphicClass = () => {
    if (!glassmorphic) return '';
    
    let classes = '';
    
    if (effectiveShowBackground) {
      classes += 'bg-gray-800/30 backdrop-blur-sm ';
    }
    
    if (effectiveShowOutline) {
      classes += 'border border-gray-700/50 ';
    }
    
    classes += 'rounded-2xl shadow-lg shadow-black/20';
    
    return classes;
  };

  // Calculate header height for spacing when in overlay mode
  let headerHeight = $derived(() => {
    // Calculate based on padding
    const paddingMap = { none: 0, sm: 32, md: 48, lg: 64, xl: 80 };
    const baseHeight = 40; // Content height
    const paddingHeight = paddingMap[padding] || 48;
    return overlay ? '0px' : `${baseHeight + paddingHeight}px`;
  });

  // Override styling for day-selection state
  let effectiveShowBackground = $derived(
    currentState === 'day-selection' ? false : showBackground
  );
  let effectiveShowOutline = $derived(
    currentState === 'day-selection' ? false : showOutline
  );
  let effectiveShowSeparator = $derived(
    currentState === 'day-selection' ? false : showSeparator
  );
</script>

<header 
  class="{
    anchored 
      ? (sticky ? 'sticky top-0' : 'relative')
      : (sticky ? 'fixed top-0 left-0 right-0' : 'absolute top-0 left-0 right-0')
  } {
    overlay ? 'z-50' : 'z-40'
  } {
    glassmorphic 
      ? getGlassmorphicClass()
      : (sticky || !anchored) && effectiveShowBackground ? 'bg-gray-900/80 backdrop-blur-sm' : ''
  } {
    effectiveShowSeparator && (sticky || !anchored) ? 'border-b border-gray-800' : ''
  } {bottomPadding} {className}"
  in:fade={{ duration: 800 }}
>
  <div class="max-w-6xl mx-auto {getPaddingClass()}">
    <div class="flex items-center justify-between">
      <!-- Left side -->
      <div class="flex items-center gap-4">
        {#if showBackButton}
          <button
            type="button"
            aria-label={getBackLabel()}
            class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onclick={handleBackClick}
          >
            <ArrowLeft class="w-6 h-6 text-gray-400" />
          </button>
        {/if}
        
        <!-- Custom left content -->
        <div class="flex items-center gap-4">
          {#if left}
            {@render left()}
          {/if}
        </div>
        
        <!-- Title section -->
        {#if title || subtitle || showVersion}
          <div>
            {#if title}
              <h1 class="text-4xl font-serif text-white mb-2 mt-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {title}
              </h1>
            {/if}
            {#if subtitle}
              <p class="text-gray-400 font-serif text-lg">{subtitle}</p>
            {/if}
            {#if showVersion}
              <p class="text-gray-400 font-mono text-sm">{t.version} {APP_VERSION}</p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Center content -->
      <div class="flex-1 flex justify-center">
        {#if center}
          {@render center()}
        {/if}
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <!-- Custom right content -->
        <div class="flex items-center gap-2">
          {#if right}
            {@render right()}
          {/if}
        </div>
        
        <!-- Language selector -->
        {#if showLanguageSelector}
          <LanguageSelector />
        {/if}
      </div>
    </div>
  </div>
</header>

<!-- Spacer for overlay mode to prevent content overlap -->
{#if overlay && !anchored}
  <div style="height: {headerHeight()}" class="w-full"></div>
{/if}
