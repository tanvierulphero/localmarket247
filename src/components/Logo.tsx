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
  // PRIVATE ADMIN LOGO (JUBAYER MACHINERIES EXACT UPLOADED LOGO)
  // Exact replication of the user's provided logo with gears, wrench, colors
  // -------------------------------------------------------------
  const mainBlue = "#1c3f94"; // Deep professional blue for gears
  const greenText = "#00a651"; // Exact green for JUBAYER
  const redText = "#c1272d"; // Exact red for MACHINERIES
  const subText = light ? "#f3f4f6" : "#222222"; // Dark slate or light gray for "Your Sustainable Partner"
  const lineText = light ? "#ffffff" : "#000000"; // Black or white for bottom crosshair

  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. BACKGROUND: DIAGONAL INDUSTRIAL WRENCH (SPANNER) */}
      <g opacity="0.18">
        {/* Wrench Shaft */}
        <line x1="45" y1="155" x2="140" y2="60" stroke="#475569" strokeWidth="14" strokeLinecap="round" />
        <line x1="45" y1="155" x2="140" y2="60" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        
        {/* Top-Right Spanner Jaw */}
        <g transform="translate(142, 58) rotate(-45)">
          <circle cx="0" cy="0" r="16" fill="#475569" />
          <rect x="-16" y="-8" width="20" height="16" fill="#ffffff" />
          <polygon points="-6,-12 -6,12 16,0" fill="#ffffff" />
        </g>

        {/* Bottom-Left Spanner End */}
        <g transform="translate(42, 158) rotate(-45)">
          <circle cx="0" cy="0" r="14" fill="#475569" />
          <circle cx="0" cy="0" r="7" fill="#ffffff" />
        </g>
      </g>

      {/* 2. GEAR SEGMENTS (Top-Right & Bottom-Left arcs with thick blue cogs) */}
      <g stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round">
        {/* Top-Right Gear Arc */}
        <path 
          d="M 100,20 A 75,75 0 0,1 175,95" 
          fill="none" 
          stroke={mainBlue} 
          strokeWidth="11" 
          strokeLinecap="square"
        />
        {/* Top-Right Gear Teeth */}
        <g fill={mainBlue}>
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(0, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(18, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(36, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(54, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(72, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(90, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
        </g>

        {/* Bottom-Left Gear Arc */}
        <path 
          d="M 25,105 A 75,75 0 0,0 100,180" 
          fill="none" 
          stroke={mainBlue} 
          strokeWidth="11" 
          strokeLinecap="square"
        />
        {/* Bottom-Left Gear Teeth */}
        <g fill={mainBlue}>
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(180, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(198, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(216, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(234, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(252, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(270, 100, 100)" stroke="#ffffff" strokeWidth="1.5" />
        </g>
      </g>

      {/* 3. CENTER BRAND TYPOGRAPHY */}
      <g textAnchor="middle" style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
        {/* "JUBAYER" */}
        <text 
          x="100" 
          y="93" 
          style={{ 
            fontSize: '25px', 
            fontWeight: '900', 
            letterSpacing: '0.06em', 
            fill: greenText,
            fontFamily: '"Impact", "Arial Black", sans-serif'
          }}
        >
          JUBAYER
        </text>

        {/* "MACHINERIES" */}
        <text 
          x="100" 
          y="119" 
          style={{ 
            fontSize: '23px', 
            fontWeight: '900', 
            letterSpacing: '0.02em', 
            fill: redText,
            fontFamily: '"Impact", "Arial Black", sans-serif'
          }}
        >
          MACHINERIES
        </text>

        {/* "Your Sustainable Partner" */}
        <text 
          x="100" 
          y="136" 
          style={{ 
            fontSize: '10px', 
            fontWeight: 'bold', 
            fontStyle: 'italic',
            fill: subText,
            fontFamily: '"Georgia", serif'
          }}
        >
          Your Sustainable Partner
        </text>
      </g>

      {/* 4. BOTTOM CROSSHAIR / TRANSFORMER MARKING */}
      <g stroke={lineText} strokeWidth="1.5">
        {/* Horizontal Line */}
        <line x1="50" y1="152" x2="150" y2="152" strokeWidth="2" />
        
        {/* Vertical Crosshair Line */}
        <line x1="120" y1="140" x2="120" y2="170" />

        {/* Central Transformer Symbol / Square Box */}
        <rect 
          x="113" 
          y="145" 
          width="14" 
          height="14" 
          fill={light ? "#1e293b" : "#ffffff"} 
          stroke={lineText} 
          strokeWidth="1.5" 
        />
        {/* Inner cross inside the box */}
        <line x1="113" y1="152" x2="127" y2="152" strokeWidth="1" />
        <line x1="120" y1="145" x2="120" y2="159" strokeWidth="1" />
      </g>
    </svg>
  );
}
