import Skeleton from '@/app/components/Skeleton'

export default function TripsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Caricamento"
      className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6"
    >
      <Skeleton className="mb-2 h-8 w-36" />
      <Skeleton className="mb-6 h-4 w-56" />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    </main>
  )
}
