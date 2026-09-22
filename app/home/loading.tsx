import Skeleton from '@/app/components/Skeleton'

export default function HomeLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6"
    >
      <Skeleton className="mb-6 h-8 w-48" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="col-span-2 h-24 sm:col-span-1" />
      </div>

      <Skeleton className="mb-3 h-5 w-40" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </main>
  )
}
