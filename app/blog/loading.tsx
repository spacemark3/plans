import Skeleton from '@/app/components/Skeleton'

export default function BlogLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6"
    >
      <Skeleton className="mb-2 h-8 w-28" />
      <Skeleton className="mb-6 h-4 w-52" />

      <Skeleton className="mb-4 h-11 w-44" />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </main>
  )
}
