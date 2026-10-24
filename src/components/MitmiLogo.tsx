import React from 'react';
import { MITMI_LOGO_PATH_D } from './logoPath.js';

export interface MitmiLogoProps {
  size?: number | string;
  variant?: 'badge' | 'mark' | 'full';
  className?: string;
  title?: string;
  dotColor?: string;
  markColor?: string;
}

export const MitmiLogo: React.FC<MitmiLogoProps> = ({
  size = 36,
  variant = 'badge',
  className = '',
  title = 'mit.mi logo',
  dotColor,
  markColor
}) => {
  const idPrefix = React.useId().replace(/:/g, '');

  if (variant === 'full') {
    return (
      <svg
        width={typeof size === 'number' ? size * 3.6 : size}
        height={size}
        viewBox="0 0 320 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`mitmi-logo-full ${className}`}
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <defs>
          <linearGradient id={`${idPrefix}-full-bg`} x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Badge Icon */}
        <g transform="translate(0, 0) scale(0.2)">
          <rect width="400" height="400" rx="95" fill={`url(#${idPrefix}-full-bg)`} />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d={MITMI_LOGO_PATH_D}
            fill={markColor || '#ffffff'}
          />
          <circle cx="272" cy="64" r="16" fill={dotColor || '#ffffff'} />
        </g>

        {/* Typografia bez czcionki bold (font-weight: 500) */}
        <text
          x="100"
          y="53"
          fontFamily="inherit"
          fontSize="42"
          fontWeight="500"
          letterSpacing="-0.02em"
          fill="currentColor"
        >
          mit<tspan fill="#2f9e57">.</tspan>mi
        </text>
      </svg>
    );
  }

  if (variant === 'mark') {
    // Samodzielny wektor bez tła
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`mitmi-logo-mark ${className}`}
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d={MITMI_LOGO_PATH_D}
          fill={markColor || '#2f9e57'}
        />
        <circle cx="272" cy="64" r="16" fill={dotColor || '#10b981'} />
      </svg>
    );
  }

  // Domyślny wariant 'badge': szmaragdowy gradient aplikacji + biały znak M + biała kropka wycentrowana (x=272, y=64)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`mitmi-logo-badge ${className}`}
      role="img"
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`${idPrefix}-badge-bg`} x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id={`${idPrefix}-badge-shadow`} x="0" y="8" width="400" height="400" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#059669" floodOpacity="0.28" />
        </filter>
      </defs>

      <rect width="400" height="400" rx="95" fill={`url(#${idPrefix}-badge-bg)`} filter={`url(#${idPrefix}-badge-shadow)`} />
      <rect x="2" y="2" width="396" height="396" rx="93" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="4" />

      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={MITMI_LOGO_PATH_D}
        fill={markColor || '#ffffff'}
      />
      {/* Kropka wycentrowana osiowo nad prawym kształtem (x=272, y=64) */}
      <circle cx="272" cy="64" r="16" fill={dotColor || '#ffffff'} />
    </svg>
  );
};

export default MitmiLogo;
