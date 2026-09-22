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
      {/* The board owns <main> so the index can sit outside it. The heading is
          still rendered here, on the server, and passed straight through. */}
      <BlogBoard initialPosts={posts} me={session.u}>
        <h1 className="mb-1 text-poster">The blog</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Thoughts and stories, newest first.
        </p>
      </BlogBoard>
    </>
  )
}
