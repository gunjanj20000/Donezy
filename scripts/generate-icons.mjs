import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

// Master Donezy SVG Icon Design
const donezySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="donezy-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="50%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>

    <!-- Top Glow / 3D Specular Highlight -->
    <radialGradient id="specular-glow" cx="30%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>

    <!-- Checkmark & Monogram Gradient -->
    <linearGradient id="check-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>

    <!-- Golden Magic Sparkle Gradient -->
    <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>

    <!-- Subtle Drop Shadow on Foreground Symbol -->
    <filter id="symbol-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#1E1B4B" flood-opacity="0.45" />
    </filter>

    <!-- Ambient Shadow for Outer Card -->
    <filter id="card-shadow" x="-25%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#4F46E5" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Base Squircle Container -->
  <rect x="36" y="36" width="440" height="440" rx="108" fill="url(#donezy-bg)" filter="url(#card-shadow)" />

  <!-- Specular 3D Lighting Layer -->
  <rect x="36" y="36" width="440" height="440" rx="108" fill="url(#specular-glow)" />

  <!-- Inner Glass Border -->
  <rect x="44" y="44" width="424" height="424" rx="100" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="4" />

  <!-- Iconic Donezy "D" + Energetic Checkmark Symbol -->
  <g filter="url(#symbol-shadow)">
    <!-- Dynamic Outer Orbit / "D" loop (Sleek modern open arc) -->
    <path
      d="M 210 130
         C 320 130, 395 190, 395 275
         C 395 360, 315 400, 210 400
         L 165 400"
      fill="none"
      stroke="url(#check-grad)"
      stroke-width="36"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.95"
    />

    <!-- Bold, Precision Checkmark Swoop cutting cleanly through the center -->
    <path
      d="M 135 270
         L 215 345
         L 365 175"
      fill="none"
      stroke="url(#check-grad)"
      stroke-width="42"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Ambient Glow Dot on Check Peak -->
    <circle cx="365" cy="175" r="7" fill="#FFFFFF" opacity="0.9" />

    <!-- Magic Sparkle Star (Top Right) - Symbolizes Smart Reminders & NLP -->
    <g transform="translate(385, 105)">
      <path
        d="M 0 -24
           Q 3 -6, 24 0
           Q 3 6, 0 24
           Q -3 6, -24 0
           Q -3 -6, 0 -24 Z"
        fill="url(#sparkle-grad)"
      />
      <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
    </g>

    <!-- Mini Sparkle Accents -->
    <circle cx="120" cy="160" r="5" fill="#FDE047" opacity="0.85" />
    <circle cx="330" cy="390" r="4" fill="#FFFFFF" opacity="0.6" />
  </g>
</svg>`;

// Maskable Icon Design (Full bleed with safe zone padding for Android adaptive icons)
const donezyMaskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg-mask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="50%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>
    <linearGradient id="check-grad-mask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <linearGradient id="sparkle-grad-mask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="shadow-mask" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#1E1B4B" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Full bleed background for adaptive icons -->
  <rect width="512" height="512" fill="url(#bg-mask)" />

  <!-- Center Symbol scaled down to fit within the 80% safe zone diameter (410px) -->
  <g transform="translate(51, 51) scale(0.8)" filter="url(#shadow-mask)">
    <!-- "D" Arc -->
    <path
      d="M 210 130
         C 320 130, 395 190, 395 275
         C 395 360, 315 400, 210 400
         L 165 400"
      fill="none"
      stroke="url(#check-grad-mask)"
      stroke-width="38"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.95"
    />

    <!-- Checkmark Swoop -->
    <path
      d="M 135 270
         L 215 345
         L 365 175"
      fill="none"
      stroke="url(#check-grad-mask)"
      stroke-width="44"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <circle cx="365" cy="175" r="7" fill="#FFFFFF" opacity="0.9" />

    <!-- Sparkle Star -->
    <g transform="translate(385, 105)">
      <path
        d="M 0 -24
           Q 3 -6, 24 0
           Q 3 6, 0 24
           Q -3 6, -24 0
           Q -3 -6, 0 -24 Z"
        fill="url(#sparkle-grad-mask)"
      />
      <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
    </g>

    <circle cx="120" cy="160" r="5" fill="#FDE047" opacity="0.85" />
    <circle cx="330" cy="390" r="4" fill="#FFFFFF" opacity="0.6" />
  </g>
</svg>`;

fs.writeFileSync('public/donezy-icon.svg', donezySvg);
fs.writeFileSync('public/smartday-icon.svg', donezySvg);
fs.writeFileSync('public/donezy-maskable.svg', donezyMaskableSvg);

console.log('SVG icons written successfully.');
