import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
});

export const IconHome = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>);
export const IconLearn = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3" /></svg>);
export const IconPuzzle = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M9 4h6v3a2 2 0 1 0 4 0V4h1v6h-3a2 2 0 1 0 0 4h3v6H9v-3a2 2 0 1 0-4 0v3H4v-6h3a2 2 0 1 0 0-4H4V4h5z" /></svg>);
export const IconPlay = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M8 5v14l11-7z" /></svg>);
export const IconCrown = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13z" /><path d="M5.5 21h13" /></svg>);
export const IconGlobe = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg>);
export const IconChart = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 20V4M4 20h16" /><path d="M8 16l3-4 3 2 4-6" /></svg>);
export const IconTrophy = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 13v3" /></svg>);
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconBolt = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>);
