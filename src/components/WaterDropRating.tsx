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
      <div className="flex flex-col mb-3">
        <label
          htmlFor={id}
          className="text-base font-semibold text-slate-800 flex items-center gap-1.5"
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

      <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1">
        <div
          role="radiogroup"
          aria-label={label}
          className="flex items-center gap-1.5 sm:gap-3"
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
                onClick={() => onChange(score)}
                onMouseEnter={() => setHovered(score)}
                onMouseLeave={() => setHovered(null)}
                className={`group relative flex items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 active:scale-90 ${
                  isFilled
                    ? 'bg-gradient-to-b from-sky-50 to-sky-100 border-2 border-sky-400 shadow-sm'
                    : 'bg-slate-50 hover:bg-sky-50/50 border-2 border-slate-200 hover:border-sky-200'
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
                    d="M12 2C12 2 3.5 13.5 3.5 18C3.5 22.4183 7.08172 26 11.5 26C15.9183 26 19.5 22.4183 19.5 18C19.5 13.5 12 2 12 2Z"
                    fill={isFilled ? `url(#drop-grad-${id}-${score})` : '#94a3b8'}
                    stroke={isFilled ? '#0284c7' : '#64748b'}
                    strokeWidth="1.2"
                  />

                  {/* Reflet de brillance goutte d'eau */}
                  {isFilled && (
                    <ellipse
                      cx="9"
                      cy="15"
                      rx="2"
                      ry="4"
                      transform="rotate(-25 9 15)"
                      fill="#ffffff"
                      opacity="0.75"
                    />
                  )}
                </svg>

                {/* Chiffre indicatif subtil sous la goutte */}
                <span
                  className={`absolute bottom-0.5 text-[10px] font-semibold transition-colors ${
                    isFilled ? 'text-sky-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  {score}
                </span>
              </button>
            );
          })}
        </div>

        {/* Badge texte d'appréciation */}
        <div className="hidden min-[380px]:block text-right">
          {activeScore > 0 ? (
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                activeScore >= 4
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : activeScore === 3
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {activeScore}/5 • {SCORE_LABELS[activeScore]}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">À noter</span>
          )}
        </div>
      </div>
    </div>
  );
};
