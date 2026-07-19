export default function StationSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`${
        featured ? "aspect-[4/5]" : "aspect-square"
      } bg-surface border border-wire flex flex-col`}
    >
      <div className="h-2/5 shrink-0 bg-ink/5 animate-skeleton-pulse" />
      <div className="flex-1 flex flex-col justify-between p-3 sm:p-4">
        <div className="w-12 h-2 bg-ink/10 animate-skeleton-pulse" />
        <div className="flex justify-center gap-3 py-2">
          <div className="w-6 h-6 rounded-full bg-ink/10 animate-skeleton-pulse" />
          <div className="w-6 h-6 rounded-full bg-ink/10 animate-skeleton-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-3/4 h-5 bg-ink/10 animate-skeleton-pulse" />
          <div className="w-1/3 h-2 bg-ink/10 animate-skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}
