import GateForm from '@/app/components/GateForm'

export default function GatePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="card-brut w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="mt-3 text-display">
            Pla<span className="text-yellow-dark">notatki</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            lista rzeczy do zrobienia
          </p>
        </div>

        <GateForm />

        <p className="mt-6 text-center text-xs text-ink-muted">
         ~ Per aspera ad astra ~
        </p>
      </div>
    </main>
  )
}
