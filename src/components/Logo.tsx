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
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    setAttempt(0);
  }, [logoUrl]);

  const cleanUrl = React.useMemo(() => {
    if (!logoUrl || typeof logoUrl !== 'string') return '';
    const trimmed = logoUrl.trim();
    if (!trimmed) return '';

    if (attempt === 0) {
      return trimmed;
    } else if (attempt === 1) {
      // Toggle leading slash for /uploads/ vs uploads/ to handle both root & subfolder deployments
      if (trimmed.startsWith('/uploads/')) {
        return trimmed.substring(1); // 'uploads/...'
      } else if (trimmed.startsWith('uploads/')) {
        return '/' + trimmed; // '/uploads/...'
      }
    }
    return '';
  }, [logoUrl, attempt]);

  // If custom uploaded logo exists and hasn't errored out all attempts
  if (cleanUrl && attempt < 2) {
    return (
      <img 
        src={cleanUrl} 
        alt={alt || (forPublic ? "Public Header Logo" : "Company Logo")} 
        className={`${className} object-contain`}
        onError={() => {
          setAttempt(prev => prev + 1);
        }}
      />
    );
  }

  // No default logo. Returns null if no custom logo uploaded or failed.
  return null;
}
