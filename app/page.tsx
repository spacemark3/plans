import GateForm from '@/app/components/GateForm'

export default function GatePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="card-glass w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span aria-hidden="true" className="text-4xl">
            🫧
          </span>
          <h1 className="mt-3 text-2xl font-semibold">La nostra bucket list</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Viaggi e sfide da fare insieme.
          </p>
        </div>

        <GateForm />

        <p className="mt-6 text-center text-xs text-ink-400">
          Solo per noi due. 💞
        </p>
      </div>
    </main>
  )
}
