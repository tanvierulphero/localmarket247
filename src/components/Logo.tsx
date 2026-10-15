import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
  forPublic?: boolean;
  logoUrl?: string;
  alt?: string;
}

/**
 * Logo Component
 * Strict Rule: No default hardcoded logo or SVG fallback.
 * Only custom uploaded logo is displayed if provided.
 */
export default function Logo({ className = "w-full h-full", light = false, forPublic = false, logoUrl, alt }: LogoProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  // If custom uploaded logo exists and hasn't errored, display it directly
  if (logoUrl && !hasError) {
    return (
      <img 
        src={logoUrl} 
        alt={alt || (forPublic ? "Public Header Logo" : "Company Logo")} 
        className={`${className} object-contain`}
        onError={() => setHasError(true)}
      />
    );
  }

  // No default logo. Returns null if no custom logo uploaded.
  return null;
}

