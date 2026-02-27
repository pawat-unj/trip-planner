import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'sage' | 'terracotta' | 'blue' | 'difficulty' | 'terrain';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default: 'bg-bg-secondary text-text-secondary',
  sage: 'bg-accent-sage/15 text-accent-forest',
  terracotta: 'bg-accent-terracotta/15 text-accent-rust',
  blue: 'bg-accent-blue/15 text-accent-blue',
  difficulty: 'bg-difficulty-moderate/15 text-difficulty-hard',
  terrain: 'bg-terrain-mountain/15 text-terrain-mountain',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Specialized badges for difficulty
interface DifficultyBadgeProps {
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  size?: 'sm' | 'md';
}

const difficultyConfig = {
  easy: { label: 'Easy', classes: 'bg-difficulty-easy/15 text-difficulty-easy' },
  moderate: { label: 'Moderate', classes: 'bg-difficulty-moderate/15 text-difficulty-moderate' },
  hard: { label: 'Hard', classes: 'bg-difficulty-hard/15 text-difficulty-hard' },
  expert: { label: 'Expert', classes: 'bg-difficulty-expert/15 text-difficulty-expert' },
};

export function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.classes}
        ${sizeClasses[size]}
      `}
    >
      {config.label}
    </span>
  );
}

// Specialized badges for terrain
interface TerrainBadgeProps {
  terrain: 'mountain' | 'coast' | 'forest' | 'desert' | 'volcano' | 'mixed';
  size?: 'sm' | 'md';
}

const terrainConfig = {
  mountain: { label: 'Mountain', icon: '⛰️', classes: 'bg-terrain-mountain/15 text-terrain-mountain' },
  coast: { label: 'Coast', icon: '🌊', classes: 'bg-terrain-coast/15 text-terrain-coast' },
  forest: { label: 'Forest', icon: '🌲', classes: 'bg-terrain-forest/15 text-terrain-forest' },
  desert: { label: 'Desert', icon: '🏜️', classes: 'bg-terrain-desert/15 text-terrain-desert' },
  volcano: { label: 'Volcano', icon: '🌋', classes: 'bg-terrain-volcano/15 text-terrain-volcano' },
  mixed: { label: 'Mixed', icon: '🗺️', classes: 'bg-bg-secondary text-text-secondary' },
};

export function TerrainBadge({ terrain, size = 'md' }: TerrainBadgeProps) {
  const config = terrainConfig[terrain];
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.classes}
        ${sizeClasses[size]}
      `}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
