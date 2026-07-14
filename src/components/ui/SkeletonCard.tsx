export default function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`bg-espn-card border border-espn-border rounded overflow-hidden animate-pulse ${tall ? 'h-full' : ''}`}>
      <div className={`w-full bg-espn-border/60 ${tall ? 'h-2/3' : 'aspect-[16/10]'}`} />
      <div className="p-3.5 space-y-3">
        <div className="h-3 w-16 bg-espn-border rounded" />
        <div className="h-4 bg-espn-border rounded w-full" />
        <div className="h-4 bg-espn-border rounded w-4/5" />
        <div className="h-3 bg-espn-border rounded w-1/2" />
      </div>
    </div>
  );
}
