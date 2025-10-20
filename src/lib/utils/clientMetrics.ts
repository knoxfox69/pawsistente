// Purpose: Client-side metrics tracking
// Context: Provides client-side performance tracking without server dependencies

// Purpose: Track page load times on the client side
// Context: Provides client-side performance tracking
export function trackClientPageLoad(page: string) {
  if (typeof window !== 'undefined') {
    // Track page view
    const userAgent = navigator.userAgent;
    
    // Measure page load time
    const loadTime = performance.now() / 1000; // Convert to seconds
    
    // Send to metrics endpoint
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'page_load',
        page,
        userAgent,
        duration: loadTime
      })
    }).catch(console.error);
  }
}

// Purpose: Track page views on the client side
// Context: Provides client-side page view tracking
export function trackClientPageView(page: string) {
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent;
    
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'page_view',
        page,
        userAgent
      })
    }).catch(console.error);
  }
}

// Purpose: Track app visits on the client side
// Context: Provides client-side app visit tracking
export function trackClientAppVisit(entryPoint: string) {
  if (typeof window !== 'undefined') {
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'app_visit',
        entryPoint
      })
    }).catch(console.error);
  }
}
