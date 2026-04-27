export default function Loading() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-slate-900 p-6">
        <div className="h-8 w-40 bg-slate-800 rounded animate-pulse mb-8" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-slate-800 rounded animate-pulse" />
          ))}
        </div>
      </aside>
      <div className="flex-1 p-6 bg-slate-50">
        <div className="space-y-6">
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-96 bg-white rounded-lg animate-pulse" />
            <div className="h-96 bg-white rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}