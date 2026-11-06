'use client';

import React, { useState } from 'react';

interface WaterDropRatingProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (val: number) => void;
  required?: boolean;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Insuffisant',
  2: 'Passable',
  3: 'Bien',
  4: 'Très bien',
  5: 'Excellent !',
};

export const WaterDropRating: React.FC<WaterDropRatingProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  required = true,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const activeScore = hovered !== null ? hovered : value;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-sm transition-all hover:border-sky-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <label
            htmlFor={id}
            className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1.5"
          >
            <span>{label}</span>
            {required && <span className="text-sky-500 font-bold">*</span>}
          </label>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Badge texte d'appréciation en haut à droite */}
        <div className="text-right shrink-0">
          {activeScore > 0 ? (
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                activeScore >= 4
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                  : activeScore === 3
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {activeScore}/5 • {SCORE_LABELS[activeScore]}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">À noter</span>
          )}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-5 gap-1.5 sm:gap-2.5 pt-1 w-full"
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const isFilled = activeScore >= score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={value === score}
              aria-label={`${score} sur 5 - ${SCORE_LABELS[score]}`}
              onClick={() => {
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try {
                    navigator.vibrate(12);
                  } catch {}
                }
                onChange(score);
              }}
              onMouseEnter={() => setHovered(score)}
              onMouseLeave={() => setHovered(null)}
              className={`group relative flex flex-col items-center justify-center h-16 sm:h-18 rounded-2xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-95 touch-manipulation select-none ${
                isFilled
                  ? 'bg-gradient-to-b from-sky-50 to-sky-100/80 border-2 border-sky-400 shadow-xs'
                  : 'bg-slate-50 hover:bg-sky-50/40 border-2 border-slate-200/80'
              }`}
            >
              {/* Icône Goutte d'eau stylisée Blue 2.0 */}
              <svg
                viewBox="0 0 24 28"
                className={`w-7 h-8 sm:w-8 sm:h-9 transition-transform duration-200 ${
                  isFilled
                    ? 'scale-110 drop-shadow-[0_2px_6px_rgba(2,132,199,0.35)]'
                    : 'opacity-40 group-hover:opacity-75 scale-95'
                }`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id={`drop-grad-${id}-${score}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                </defs>

                {/* Forme principale de goutte */}
                <path
                  d="M12 2 C12 2, 4 12, 4 18 C4 22.4183 7.58172 26 12 26 C16.4183 26 20 22.4183 20 18 C20 12 12 2 12 2 Z"
                  fill={isFilled ? `url(#drop-grad-${id}-${score})` : '#94a3b8'}
                  stroke={isFilled ? '#0284c7' : '#cbd5e1'}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* Reflet de brillance pour effet eau 3D */}
                {isFilled && (
                  <path
                    d="M9 14 C7.5 16.5 7.5 19 8.5 21"
                    stroke="rgba(255, 255, 255, 0.75)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Chiffre indicatif subtil sous la goutte */}
              <span
                className={`text-[10px] font-semibold transition-colors mt-0.5 ${
                  isFilled ? 'text-sky-800 font-bold' : 'text-slate-400'
                }`}
              >
                {score}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
