import React, { useState } from 'react';

export interface LetsEstimateLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'light' | 'dark' | 'emerald';
  theme?: 'dark' | 'light' | 'emerald';
  className?: string;
  showSubtitle?: boolean;
  showTagline?: boolean;
  taglineText?: string;
  useGreenHouseIcon?: boolean;
}

export const LetsEstimateLogo: React.FC<LetsEstimateLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme,
  className = '',
  showSubtitle = true,
  showTagline = true,
  taglineText = 'Plan • Measure • Build',
  useGreenHouseIcon = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const effectiveTheme = theme || (variant === 'light' ? 'light' : variant === 'dark' ? 'dark' : variant === 'emerald' ? 'emerald' : 'dark');
  const shouldShowSubtitle = showTagline !== undefined ? showTagline : showSubtitle;

  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  }[size];

  const titleSizes = {
    sm: 'text-sm font-black tracking-tight',
    md: 'text-lg font-black tracking-tight',
    lg: 'text-xl font-black tracking-tight',
    xl: 'text-2xl font-black tracking-tight',
  }[size];

  const isLight = effectiveTheme === 'light';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Green House / Construction Roof emblem */}
      {useGreenHouseIcon ? (
        <div
          className={`relative ${iconDimensions} rounded-xl shrink-0 flex items-center justify-center transition-transform duration-200 hover:scale-105`}
        >
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-xs"
          >
            {/* Outer stylized house silhouette */}
            <path
              d="M20 5L4 18H9V33C9 34.1046 9.89543 35 11 35H29C30.1046 35 31 34.1046 31 33V18H36L20 5Z"
              fill="#059669"
            />
            {/* Chimney */}
            <path
              d="M27 9V14.5L31 17.5V9H27Z"
              fill="#047857"
            />
            {/* Inner door / window arch */}
            <path
              d="M16 23C16 20.7909 17.7909 19 20 19C22.2091 19 24 20.7909 24 23V35H16V23Z"
              fill={isLight ? '#FFFFFF' : '#0B1D28'}
            />
            {/* Floating green accent block */}
            <circle cx="20" cy="14" r="2.5" fill="#34D399" />
          </svg>
        </div>
      ) : (
        <div
          className={`relative ${iconDimensions} rounded-xl overflow-hidden shadow-xs shrink-0 flex items-center justify-center border ${
            isLight ? 'border-slate-300 bg-white' : 'border-emerald-600/30 bg-slate-900'
          }`}
        >
          {!imgError ? (
            <img
              src="/estimate_logo.jpg"
              alt="Let's Estimate Logo"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <svg viewBox="0 0 40 40" fill="none" className="w-full h-full p-1">
              <path d="M20 6L5 18H10V33H30V18H35L20 6Z" fill="#10B981" />
            </svg>
          )}
        </div>
      )}

      {/* Typography Brand Name */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col leading-tight text-left">
          <div className="flex items-center space-x-1">
            <span className={`${titleSizes} ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Let&apos;s
            </span>
            <span className={`${titleSizes} text-emerald-600`}>
              Estimate
            </span>
          </div>
          {shouldShowSubtitle && (
            <span className={`text-[10px] font-medium tracking-wide mt-0.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {taglineText}
            </span>
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
