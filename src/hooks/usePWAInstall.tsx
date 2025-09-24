import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Check if prompt was dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const neverShow = localStorage.getItem('pwa-install-never-show');
      
      if (neverShow === 'true') return;
      
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) return;
      }
      
      // Show install prompt after user has had time to interact with app
      setTimeout(() => {
        if (!isStandalone && !isIOSStandalone) {
          setShowInstallPrompt(true);
        }
      }, 10000); // 10 seconds delay
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIsInstalling(false);
      // Clear dismiss flags on successful install
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-never-show');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt && !isIOS) return;

    setIsInstalling(true);
    
    try {
      if (deferredPrompt) {
        // Android/Chrome PWA installation
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
          setShowInstallPrompt(false);
        }
        
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const dismissInstallPrompt = (permanent = false) => {
    setShowInstallPrompt(false);
    if (permanent) {
      localStorage.setItem('pwa-install-never-show', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', new Date().getTime().toString());
    }
  };

  // Show iOS-specific prompt for devices that don't support beforeinstallprompt
  useEffect(() => {
    if (isIOS && !isInstalled && window.matchMedia('(display-mode: browser)').matches) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const neverShow = localStorage.getItem('pwa-install-never-show');
      
      if (neverShow === 'true') return;
      
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) return;
      }
      
      // Show iOS prompt after delay
      setTimeout(() => setShowInstallPrompt(true), 10000);
    }
  }, [isIOS, isInstalled]);

  return {
    showInstallPrompt: showInstallPrompt && !isInstalled,
    installPWA,
    dismissInstallPrompt,
    isInstalled,
    canInstall: !!deferredPrompt || isIOS,
    isInstalling,
    isIOS
  };
};