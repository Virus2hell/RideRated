// Illustrated sunset ghat scene: layered Sahyadri ridges and a winding road with a dashed centre line.
export default function HeroScene({ className = '' }) {
  return (
    <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0a0a" />
          <stop offset="0.45" stopColor="#2a1206" />
          <stop offset="0.72" stopColor="#9a3412" />
          <stop offset="0.82" stopColor="#f97316" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fed7aa" />
          <stop offset="0.6" stopColor="#fb923c" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.7" stopColor="#0a0a0a" stopOpacity="0" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>

      <rect width="1440" height="720" fill="url(#sky)" />
      <circle cx="1010" cy="430" r="150" fill="url(#sun)" />

      {/* Ridges, back to front */}
      <path d="M0 470 L120 420 L210 445 L330 380 L430 430 L560 360 L690 425 L800 390 L930 440 L1060 370 L1180 420 L1300 385 L1440 430 V720 H0Z" fill="#7c2d12" opacity="0.55" />
      <path d="M0 520 L90 480 L200 505 L310 455 L420 500 L520 470 L640 515 L760 470 L880 510 L1000 460 L1130 505 L1260 470 L1440 500 V720 H0Z" fill="#431407" />
      <path d="M0 580 L140 530 L260 560 L380 525 L520 570 L640 545 L780 580 L900 540 L1040 575 L1180 535 L1320 565 L1440 540 V720 H0Z" fill="#1c0d05" />

      {/* Winding road */}
      <path d="M430 720 C 600 650, 860 640, 790 585 C 740 548, 690 540, 735 520 L 748 520 C 715 540, 775 552, 815 585 C 900 650, 820 680, 1010 720 Z" fill="url(#road)" />
      <path d="M720 720 C 790 660, 860 640, 800 585 C 760 550, 712 540, 741 521" fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="22 18" opacity="0.9" />

      {/* Foreground hills framing the road */}
      <path d="M0 640 C 200 600, 330 620, 470 690 L 480 720 H0Z" fill="#0c0603" />
      <path d="M1440 630 C 1260 600, 1100 640, 980 700 L 990 720 H1440Z" fill="#0c0603" />

      <rect width="1440" height="720" fill="url(#fade)" />
    </svg>
  );
}
