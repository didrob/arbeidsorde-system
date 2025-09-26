import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkIfMobile = () => {
      // Prioritize touch capability over screen size for true mobile detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
      
      // Primary check: if device has touch capability, it's mobile regardless of orientation
      // Secondary check: if screen is small, treat as mobile (for desktop browsers in narrow windows)
      const isMobileDevice = hasTouch || isSmallScreen;
      
      setIsMobile(isMobileDevice);
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Listen for multiple events to catch all orientation changes
    const handleChange = () => {
      // Use requestAnimationFrame to ensure layout has updated after orientation change
      requestAnimationFrame(checkIfMobile);
    };
    
    mql.addEventListener("change", handleChange);
    window.addEventListener("orientationchange", handleChange);
    window.addEventListener("resize", handleChange);
    
    // Initial check
    checkIfMobile();
    
    return () => {
      mql.removeEventListener("change", handleChange);
      window.removeEventListener("orientationchange", handleChange);
      window.removeEventListener("resize", handleChange);
    };
  }, []);

  return !!isMobile;
}
