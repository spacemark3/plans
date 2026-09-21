import NavBar from '@/app/components/NavBar'
import BlogBoard from '@/app/components/blog/BlogBoard'
import { getPosts } from '@/app/lib/data'
import { requireSession } from '@/app/lib/session'

export default async function BlogPage() {
  const session = await requireSession()
  const posts = await getPosts()

  return (
    <>
      <NavBar active="blog" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        <h1 className="mb-1 text-2xl font-semibold">Il blog</h1>
        <p className="mb-6 text-sm text-ink-500">
          Pensieri e racconti, dal più recente.
        </p>
        <BlogBoard initialPosts={posts} me={session.u} />
      </main>
    </>
  )
}
