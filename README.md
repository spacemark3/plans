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

## Deploy su Vercel

### 1. Repo su GitHub

Crealo **vuoto e privato** su <https://github.com/new>: niente README, niente
`.gitignore`, niente licenza. Se aggiungi uno di quei file il primo push viene
rifiutato per non-fast-forward.

```powershell
git remote add origin https://github.com/TUO-UTENTE/bucket-list.git
git push -u origin main
```

GitHub non accetta più la password dell'account su HTTPS: lascia fare a Git
Credential Manager, oppure genera un personal access token con scope `repo` su
<https://github.com/settings/tokens> e incollalo al posto della password.

Dopo il push, guarda il repo su GitHub e **controlla che `.env` non ci sia**.

### 2. Import su Vercel

<https://vercel.com/new> → scegli il repo. Il framework viene riconosciuto da
solo come Next.js e la root directory è la root del repo: non serve nessun
`vercel.json`. **Non deployare ancora.**

### 3. Le variabili d'ambiente — questo è il passo che rompe tutto

**Vercel non legge il tuo `.env` locale.** Mai. Va riempito a mano.

Nella schermata di import apri *Environment Variables*: il campo accetta un
blocco `.env` incollato tutto insieme. Servono queste sei, e vanno spuntati
**tutti e tre** gli ambienti (Production, Preview, Development):

| Variabile | Note |
|---|---|
| `DATABASE_URL` | Deve contenere il nome del database: `.../bucket-list?retryWrites=...`. Senza, Mongoose usa in silenzio un database chiamato `test` |
| `AUTH_SECRET` | 32+ byte casuali |
| `PARTNER_A_NAME` / `PARTNER_B_NAME` | Solo display |
| `PARTNER_A_PASSWORD` / `PARTNER_B_PASSWORD` | Diverse tra loro |

`BLOB_READ_WRITE_TOKEN` non si scrive a mano: arriva da solo quando colleghi lo
store Blob (passo 5).

### 4. MongoDB Atlas deve accettare Vercel

Le function di Vercel non hanno un IP fisso, quindi una allowlist per IP passa
in locale e poi fallisce in produzione con un `serverSelectionTimeout`.

Atlas → Network Access → **`0.0.0.0/0`**. A proteggere il database resta la
password dell'utente: che sia lunga.

### 5. Blob store (serve solo per le foto)

Vercel → Storage → Create → Blob → collegalo al progetto. Questo inietta
`BLOB_READ_WRITE_TOKEN` da solo. In locale:

```powershell
npm i -g vercel
vercel link
vercel env pull .env
```

Non esiste un emulatore locale del Blob: senza store le foto non si possono
provare in sviluppo.

### 6. Deploy e smoke test

Dal telefono: cancello → login con **tutte e due** le password → aggiungi un
viaggio → segnalo fatto → scrivi un post. In DevTools il cookie `bl_session`
adesso deve avere **`Secure`** (in locale no, ed è voluto).

### Se il sito si apre ma il login dà 500

È `AUTH_SECRET` che manca su Vercel. La firma di questo guasto è infida —
misurata, non ipotizzata:

| Rotta | Risultato senza `AUTH_SECRET` |
|---|---|
| `GET /` | **200**, il cancello si apre benissimo |
| `GET /home` | 307 verso `/`, sembra un normale rimbalzo da sloggati |
| `GET /api/items` | 401, sembra corretto |
| `POST /api/auth/login` | **500** |

Solo il login esplode, perché `verifySession(undefined)` ritorna `null` prima
ancora di toccare la chiave. **L'app sembra sanissima finché qualcuno non prova
a entrare.** Nei log del server: `Error: Missing AUTH_SECRET environment variable`.

### Altri guasti tipici

| Sintomo | Causa |
|---|---|
| Login 200 ma rimbalza subito al cancello | Cookie `Secure` su HTTP. In produzione non capita (Vercel è HTTPS) |
| Tutto carica, ma le voci non si salvano | `DATABASE_URL` senza nome del database: stai scrivendo su `test` |
| `serverSelectionTimeout` solo in produzione | Allowlist IP su Atlas, vedi passo 4 |
| `Authentication failed` | Password Atlas sbagliata, o un carattere speciale non percent-encoded (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `%` → `%25`) |
| 400 su `/_next/image` | `remotePatterns` sbagliato in `next.config.ts` |

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
