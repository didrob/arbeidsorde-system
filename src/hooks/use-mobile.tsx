import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkIfMobile = () => {
      // Check for touch capability and screen size
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
      
      // Consider it mobile if it has touch OR is small screen
      // This ensures mobile layout persists even in landscape orientation
      setIsMobile(hasTouch || isSmallScreen);
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Listen for both resize and orientation changes
    const handleChange = () => checkIfMobile();
    
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
