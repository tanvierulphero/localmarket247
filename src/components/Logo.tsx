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

  const cleanUrl = React.useMemo(() => {
    if (!logoUrl || typeof logoUrl !== 'string') return '';
    const trimmed = logoUrl.trim();
    if (!trimmed) return '';
    // Normalize relative paths without leading slash if they point to uploads
    if (trimmed.startsWith('uploads/')) {
      return `/${trimmed}`;
    }
    return trimmed;
  }, [logoUrl]);

  // If custom uploaded logo exists and hasn't errored, display it directly
  if (cleanUrl && !hasError) {
    return (
      <img 
        src={cleanUrl} 
        alt={alt || (forPublic ? "Public Header Logo" : "Company Logo")} 
        className={`${className} object-contain`}
        onError={(e) => {
          console.warn('Logo image failed to load from URL:', cleanUrl, e);
          setHasError(true);
        }}
      />
    );
  }

  // No default logo. Returns null if no custom logo uploaded or failed.
  return null;
}

