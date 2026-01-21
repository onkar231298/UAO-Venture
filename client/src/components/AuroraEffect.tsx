import { useState, useEffect } from "react";

const EUROPEAN_COUNTRIES = [
  'DE', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'GR', 
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 
  'SI', 'ES', 'SE', 'GB', 'NO', 'CH', 'IS', 'UA', 'BY', 'RS', 'BA', 'ME', 
  'MK', 'AL', 'MD', 'XK'
];

export function AuroraEffect() {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show aurora effect on every page load
    setShow(true);
    
    setTimeout(() => {
      setFadeOut(true);
    }, 4000);
    
    setTimeout(() => {
      setShow(false);
    }, 5000);
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed left-0 right-0 bottom-0 z-[9999] pointer-events-none transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        top: '140px',
        background: `
          radial-gradient(ellipse 120% 80% at 50% 100%, 
            rgba(34, 197, 94, 0.5) 0%, 
            rgba(34, 197, 94, 0.3) 20%, 
            transparent 50%
          ),
          radial-gradient(ellipse 100% 60% at 30% 80%, 
            rgba(74, 222, 128, 0.4) 0%, 
            transparent 40%
          ),
          radial-gradient(ellipse 100% 60% at 70% 80%, 
            rgba(34, 197, 94, 0.35) 0%, 
            transparent 40%
          ),
          radial-gradient(ellipse 150% 100% at 50% 50%, 
            rgba(239, 68, 68, 0.4) 0%, 
            rgba(190, 24, 93, 0.3) 30%, 
            transparent 60%
          ),
          radial-gradient(ellipse 120% 80% at 40% 30%, 
            rgba(244, 63, 94, 0.45) 0%, 
            rgba(219, 39, 119, 0.25) 40%, 
            transparent 70%
          ),
          radial-gradient(ellipse 100% 70% at 60% 20%, 
            rgba(168, 85, 247, 0.3) 0%, 
            transparent 50%
          ),
          linear-gradient(to top, 
            rgba(0, 0, 0, 0.7) 0%, 
            rgba(15, 23, 42, 0.5) 30%, 
            rgba(30, 41, 59, 0.3) 60%, 
            rgba(15, 23, 42, 0.5) 100%
          )
        `
      }}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 100%, 
              rgba(74, 222, 128, 0.2) 0%, 
              transparent 50%
            ),
            radial-gradient(ellipse 60% 40% at 45% 60%, 
              rgba(239, 68, 68, 0.15) 0%, 
              transparent 50%
            )
          `,
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-lg">
        Aurora Borealis visible in Germany tonight
      </div>
    </div>
  );
}
