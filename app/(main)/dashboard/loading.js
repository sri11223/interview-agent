export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 animate-pulse">
      {/* Welcome banner skeleton */}
      <div className="h-36 rounded-2xl bg-gray-200" />

      {/* Practice Hub skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Recent sessions skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
