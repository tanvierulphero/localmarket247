import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
  forPublic?: boolean; // When true, displays HITACHI AIR SOLUTION CENTER logo for public catalog website
}

export default function Logo({ className = "w-full h-full", light = false, forPublic = false }: LogoProps) {
  // -------------------------------------------------------------
  // PUBLIC WEBSITE LOGO (HITACHI / SUPERSTAR ENGINEERING LOGO)
  // Keeps the public site strictly isolated from the private admin pad
  // -------------------------------------------------------------
  if (forPublic) {
    const colorClass = light ? "text-white" : "text-blue-900";
    return (
      <svg 
        viewBox="0 0 430 150" 
        className={`${className} ${colorClass}`}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Left Gear Segment */}
        <g>
          {/* Teeth */}
          <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-15, 110, 60)" />
          <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-35, 110, 60)" />
          <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-55, 110, 60)" />
          <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-75, 110, 60)" />
          <rect x="104" y="7" width="12" height="12" rx="2" transform="rotate(-95, 110, 60)" />
          
          {/* Main curved ring */}
          <path d="M 62,60 A 48,48 0 0,1 110,12" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          {/* Inner thin accent ring */}
          <path d="M 72,60 A 38,38 0 0,1 110,22" fill="none" stroke="currentColor" strokeWidth="3" />
        </g>

        {/* Brand Text */}
        <g>
          <text 
            x="215" 
            y="75" 
            textAnchor="middle" 
            style={{ 
              fontSize: '44px', 
              fontWeight: 900, 
              fontFamily: 'Plus Jakarta Sans, sans-serif', 
              letterSpacing: '-0.02em', 
              fill: 'currentColor' 
            }}
          >
            HITACHI
          </text>
          <text 
            x="215" 
            y="105" 
            textAnchor="middle" 
            style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              fontFamily: 'Plus Jakarta Sans, sans-serif', 
              letterSpacing: '0.18em', 
              fill: 'currentColor' 
            }}
          >
            AIR SOLUTION CENTER
          </text>
        </g>

        {/* Bottom Right Gear Segment */}
        <g>
          {/* Teeth */}
          <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(15, 320, 90)" />
          <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(35, 320, 90)" />
          <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(55, 320, 90)" />
          <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(75, 320, 90)" />
          <rect x="314" y="131" width="12" height="12" rx="2" transform="rotate(95, 320, 90)" />
          
          {/* Main curved ring */}
          <path d="M 320,138 A 48,48 0 0,0 368,90" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          {/* Inner thin accent ring */}
          <path d="M 320,128 A 38,38 0 0,0 358,90" fill="none" stroke="currentColor" strokeWidth="3" />
        </g>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // PRIVATE ADMIN LOGO (JUBAYER MACHINERIES LOGO WITH MECHANICAL COGS)
  // Matching the uploaded official pad image
  // -------------------------------------------------------------
  const textColor = light ? "#ffffff" : "#1e3a8a"; // Deep Blue for Jubayer Machineries
  const sloganColor = light ? "#fecdd3" : "#dc2626"; // Red/Crimson for the slogan
  const primaryGearColor = light ? "#93c5fd" : "#1e3a8a"; // Gear segment main color
  const accentGearColor = light ? "#fda4af" : "#ef4444"; // Accent gear color

  return (
    <svg 
      viewBox="0 0 540 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon: Double mechanical gears */}
      <g>
        {/* Outer Gear */}
        <g fill={primaryGearColor}>
          <path d="M 32,88 A 40,40 0 1,1 88,32" fill="none" stroke={primaryGearColor} strokeWidth="7" strokeLinecap="round" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(0, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(30, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(60, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(90, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(120, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(150, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(-30, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(-60, 60, 60)" />
          <rect x="55" y="10" width="10" height="10" rx="2" transform="rotate(-90, 60, 60)" />
          <circle cx="60" cy="60" r="28" fill="none" stroke={primaryGearColor} strokeWidth="2" strokeDasharray="5,3" />
        </g>
        
        {/* Inner Gear */}
        <g fill={accentGearColor}>
          <circle cx="60" cy="60" r="18" fill="none" stroke={accentGearColor} strokeWidth="4" />
          <rect x="57" y="38" width="6" height="5" rx="1" transform="rotate(0, 60, 60)" />
          <rect x="57" y="38" width="6" height="5" rx="1" transform="rotate(45, 60, 60)" />
          <rect x="57" y="38" width="6" height="5" rx="1" transform="rotate(90, 60, 60)" />
          <rect x="57" y="38" width="6" height="5" rx="1" transform="rotate(135, 60, 60)" />
          <circle cx="60" cy="60" r="8" fill={light ? "#1e293b" : "#ffffff"} />
          <circle cx="60" cy="60" r="4" fill={accentGearColor} />
        </g>

        {/* Technical cross lines */}
        <line x1="60" y1="28" x2="60" y2="92" stroke={primaryGearColor} strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="28" y1="60" x2="92" y2="60" stroke={primaryGearColor} strokeWidth="1.5" strokeOpacity="0.4" />
      </g>

      {/* Typography for Jubayer Machineries */}
      <g>
        <text 
          x="125" 
          y="58" 
          style={{ 
            fontSize: '44px', 
            fontWeight: 900, 
            fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif', 
            letterSpacing: '-0.01em', 
            fill: textColor 
          }}
        >
          Jubayer Machineries
        </text>
        <text 
          x="125" 
          y="88" 
          style={{ 
            fontSize: '15.5px', 
            fontWeight: 700, 
            fontStyle: 'italic',
            fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif', 
            letterSpacing: '0.01em',
            fill: sloganColor 
          }}
        >
          Your Problem Solution is Sustainable Partner
        </text>
      </g>
    </svg>
  );
}
