export default function SkeletonCard() {
  return (
    <div className="bg-espn-card rounded-lg overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-espn-border" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 bg-espn-border rounded" />
        <div className="h-4 bg-espn-border rounded w-full" />
        <div className="h-4 bg-espn-border rounded w-4/5" />
        <div className="h-3 bg-espn-border rounded w-1/2" />
      </div>
    </div>
  );
}
