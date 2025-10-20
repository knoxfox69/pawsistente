// Purpose: PWA utilities for install prompt and service worker management
// Context: Handles PWA installation and service worker registration

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private installPromptCallback: (() => void) | null = null;

  private constructor() {
    this.checkInstallStatus();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  // Purpose: Initialize PWA functionality
  // Context: Sets up event listeners and checks installation status
  public initialize(): void {
    if (typeof window === 'undefined') return;

    console.log('Initializing PWA manager...');

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt event fired', e);
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      console.log('PWA install prompt available', this.deferredPrompt);
      
      // Notify callback if set
      if (this.installPromptCallback) {
        console.log('Calling install prompt callback');
        this.installPromptCallback();
      }
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('App installed event fired');
      this.isInstalled = true;
      this.deferredPrompt = null;
      console.log('PWA was installed');
    });

    // Register service worker
    this.registerServiceWorker();
    
    // Check if already installed
    this.checkInstallStatus();
    console.log('PWA manager initialized. Can install:', this.canInstall());
  }

  // Purpose: Set callback for when install prompt becomes available
  // Context: Allows components to react to install prompt availability
  public setInstallPromptCallback(callback: () => void): void {
    this.installPromptCallback = callback;
    
    // If prompt is already available, call immediately
    if (this.canInstall()) {
      callback();
    }
  }

  // Purpose: Check if app can be installed
  // Context: Returns true if install prompt is available
  public canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  // Purpose: Show install prompt
  // Context: Prompts user to install the PWA
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  // Purpose: Check if app is already installed
  // Context: Determines installation status
  private checkInstallStatus(): void {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (installed)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
  }

  // Purpose: Register service worker
  // Context: Enables offline functionality
  private async registerServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Purpose: Check if app is installed
  // Context: Returns current installation status
  public getInstallStatus(): boolean {
    return this.isInstalled;
  }

  // Purpose: Get debug information
  // Context: Returns internal state for debugging
  public getDebugInfo() {
    return {
      deferredPrompt: this.deferredPrompt,
      isInstalled: this.isInstalled,
      canInstall: this.canInstall(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
      standalone: typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false
    };
  }
}
