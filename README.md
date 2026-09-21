# bucket-list

Una app privata per due: la nostra lista di **viaggi** e **sfide** da fare
insieme, più un **blog** per i pensieri e i racconti di quello che abbiamo fatto.

Non è un prodotto. Niente account, niente ruoli, niente condivisione pubblica.
Due persone, due password, un database.

## Stack

- Next.js 16.2.4 (App Router, `app/` in root, nessun `src/`)
- React 19.2.4, TypeScript 5 strict
- Tailwind CSS v4 — tutta la configurazione sta in `app/globals.css` (`@theme`),
  non esiste `tailwind.config.js`
- MongoDB + Mongoose 7
- `@vercel/blob` per le foto (upload lato client)

## Come si entra

Non ci sono username. C'è **un solo campo password**, e la password che scrivi
dice chi sei: `PARTNER_A_PASSWORD` ti identifica come partner `a`,
`PARTNER_B_PASSWORD` come partner `b`. L'autore di ogni voce e di ogni post
viene timbrato dalla sessione, mai da quello che manda il browser.

Le due password **devono essere diverse**: se sono identiche l'identità è
ambigua e il login viene rifiutato per entrambe.

### Sulla sicurezza, onestamente

Il rate limiting del login è una `Map` in memoria: 10 tentativi al minuto per IP.
Su Vercel questo vale **per singola istanza lambda**, non globalmente — è un
dosso, non un muro. La difesa vera è l'entropia della password.

**Usate passphrase**, tipo quattro parole a caso unite da un trattino, non una
parola sola con un numero in fondo.

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Poi riempite `.env`:

| Variabile | Cosa ci va |
|---|---|
| `DATABASE_URL` | La connection string di MongoDB Atlas (o `mongodb://localhost:27017/bucket-list`) |
| `AUTH_SECRET` | 32+ byte casuali — vedi sotto |
| `PARTNER_A_NAME` / `PARTNER_B_NAME` | I nomi mostrati a schermo. Solo display: rinominare è una modifica a `.env`, non una migrazione |
| `PARTNER_A_PASSWORD` / `PARTNER_B_PASSWORD` | Le due password, diverse tra loro |
| `BLOB_READ_WRITE_TOKEN` | Da `vercel env pull .env` |

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

`.env` contiene due password vere. `.gitignore` copre `.env*` e `.vercel` —
che resti così.

## Sviluppo

```powershell
npm run dev     # http://localhost:3000
npm run build
npx eslint
```

Per Mongo in locale:

```powershell
docker run -d --name bl-mongo -p 27017:27017 mongo:7
```

## Note di architettura

- **Proxy, non middleware.** In Next.js 16 il file è `proxy.ts` in root ed
  esporta una funzione `proxy`. Non impostare mai `runtime` lì dentro: l'opzione
  non esiste nei file Proxy e impostarla lancia un errore.
- Il proxy **non è** il confine di autorizzazione. Protegge le pagine per
  comodità, ma ogni pagina chiama `requireSession()` e ogni route handler chiama
  `getSession()` per conto suo. La ridondanza è voluta: così una modifica al
  `matcher` non può aprire un buco in silenzio.
- `/api/*` non è nel matcher di proposito — un client JSON deve ricevere un
  **401**, non un 307 verso una pagina HTML.
- `app/lib/auth.ts` non importa nulla (né `next/*` né `node:*`) così è sicuro nel
  bundle del proxy; usa Web Crypto. `app/lib/session.ts` è l'unico modulo che
  tocca `next/headers`.
- Il cookie è `httpOnly`, `SameSite=Lax`, e `Secure` **solo in produzione**: un
  cookie `Secure` su `http://localhost` viene scartato in silenzio dal browser e
  il login sembra funzionare ma rimbalza subito al cancello.
