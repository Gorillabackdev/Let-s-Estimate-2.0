import React, { useState } from 'react';

interface LetsEstimateLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'light' | 'dark' | 'emerald';
  theme?: 'dark' | 'light' | 'emerald';
  className?: string;
  showSubtitle?: boolean;
  showTagline?: boolean;
}

export const LetsEstimateLogo: React.FC<LetsEstimateLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme,
  className = '',
  showSubtitle = true,
  showTagline,
}) => {
  const [imgError, setImgError] = useState(false);
  const effectiveTheme = theme || (variant === 'light' ? 'light' : variant === 'dark' ? 'dark' : variant === 'emerald' ? 'emerald' : 'dark');
  const shouldShowSubtitle = showTagline !== undefined ? showTagline : showSubtitle;

  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const titleSizes = {
    sm: 'text-base font-black tracking-tight',
    md: 'text-xl font-black tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
  }[size];

  const isLight = effectiveTheme === 'light';
  const isEmerald = effectiveTheme === 'emerald';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon with official image emblem & SVG fallback */}
      <div
        className={`relative ${iconDimensions} rounded-xl overflow-hidden shadow-md shrink-0 flex items-center justify-center border ${
          isEmerald
            ? 'border-emerald-400/50 bg-emerald-800'
            : isLight
            ? 'border-slate-300 bg-white shadow-sm'
            : 'border-amber-400/30 bg-slate-900'
        }`}
      >
        {!imgError ? (
          <img
            src="/estimate_logo.jpg"
            alt="Let's Estimate - Estimate with Isaac Logo"
            className="w-full h-full object-cover object-center transform hover:scale-105 transition duration-200"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-1"
          >
            <rect x="8" y="10" width="32" height="34" rx="4" fill="#0A192F" stroke="#F59E0B" strokeWidth="2.5" />
            <rect x="18" y="5" width="12" height="7" rx="2" fill="#F59E0B" />
            <circle cx="24" cy="8.5" r="1.5" fill="#0A192F" />
            <rect x="13" y="26" width="4.5" height="12" rx="1" fill="#38BDF8" />
            <rect x="21" y="20" width="4.5" height="18" rx="1" fill="#F59E0B" />
            <rect x="29" y="15" width="4.5" height="23" rx="1" fill="#10B981" />
            <line x1="14" y1="17" x2="18" y2="17" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="21" x2="16" y2="21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="22" y1="14" x2="26" y2="14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="37" cy="38" r="5" fill="#F59E0B" stroke="#0A192F" strokeWidth="1.5" />
            <path d="M35 38L36.5 39.5L39.5 36.5" stroke="#0A192F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Typography Brand Name */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center space-x-1.5">
            <span className={isLight ? 'text-slate-900' : 'text-white'}>
              <span className={titleSizes}>Let&apos;s</span>
            </span>
            <span className={`text-amber-400 drop-shadow-xs ${titleSizes}`}>
              Estimate
            </span>
          </div>
          {shouldShowSubtitle && (
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`text-[10px] font-bold tracking-wider uppercase ${
                  isEmerald 
                    ? 'text-emerald-200'
                    : isLight 
                    ? 'text-slate-600' 
                    : 'text-amber-200/90'
                }`}
              >
                Estimate with Isaac
              </span>
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              <span
                className={`text-[9px] font-semibold tracking-tight ${
                  isEmerald
                    ? 'text-emerald-300'
                    : isLight
                    ? 'text-emerald-700'
                    : 'text-emerald-400'
                }`}
              >
                NIQS / BESMM4
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NiqsSealBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCaption?: boolean;
}

export const NiqsSealBadge: React.FC<NiqsSealBadgeProps> = ({
  size = 'md',
  className = '',
  showCaption = true,
}) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${dimensions} rounded-full overflow-hidden shadow-sm border border-amber-400/40 bg-slate-900 shrink-0`}>
        <img
          src="/niqs_seal.jpg"
          alt="NIQS & QSRBN Professional Accreditation Seal"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {showCaption && (
        <div className="flex flex-col text-left leading-none">
          <span className="text-[11px] font-bold text-slate-800 tracking-tight">
            NIQS &amp; QSRBN Compliant
          </span>
          <span className="text-[9px] text-emerald-700 font-medium mt-0.5">
            BESMM4 4th Edition Certified
          </span>
        </div>
      )}
    </div>
  );
};
