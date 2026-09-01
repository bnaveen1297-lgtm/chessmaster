/** The chesshub360 lockup: the icon + wordmark text (no raster wordmark). */
export function Wordmark({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const icon = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl';
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src="/icon.png" alt="" className={`${icon} rounded-[10px]`} />
      <span className={`font-display ${text} font-extrabold lowercase tracking-tight text-ink`}>
        chess<span className="text-teal">hub</span>360
      </span>
    </div>
  );
}
