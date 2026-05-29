# Inkwell

A flat, multi-author blogging platform. Every signed-in user is both an author
and a reader — write posts, publish or keep them as drafts, read others' work,
comment, like, and bookmark. There is no editorial approval queue.

Inkwell runs entirely on your machine. It uses a local PostgreSQL database and
stores uploaded images on the local filesystem — no hosting, serverless, or
third-party services.

## Features

- **Auth** — email + password sign up / sign in (Auth.js v5, argon2id hashing).
- **Rich editor** — Tiptap with images, links, headings; save drafts and publish.
- **Reading feed** — newest-published-first, cursor "Load more" pagination.
- **Post pages** — full article, author byline, cover image, tags, category.
- **Comments** — oldest-first; edit and delete your own.
- **Likes** — one per user per post, toggleable.
- **Bookmarks** — private reading list.
- **Tags & categories** — freeform tags (case-insensitive dedupe) plus a fixed
  set of categories (one per post).
- **Full-text search** — PostgreSQL `tsvector` + GIN index, ranked results.
- **Dashboard** — your Drafts, Published, and Bookmarks.
- **Public profiles** — `/u/<username>` with the author's published posts.
- **Light / dark mode** — remembers your choice.
- **Motion & a11y** — restrained Framer Motion that honors
  `prefers-reduced-motion`; responsive and keyboard accessible.

## Tech stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS · hand-owned shadcn/ui-style components · Framer Motion
- Prisma · PostgreSQL 16 (full-text search)
- Auth.js / NextAuth v5 (Credentials provider, JWT sessions) · argon2
- Zod validation · isomorphic-dompurify (HTML sanitization)

## Prerequisites

- **Node.js 18.18+** (tested on Node 20/23)
- **PostgreSQL 16** running locally. On macOS with Homebrew:
  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

```bash
createdb inkwell
```

(Or `psql -c "CREATE DATABASE inkwell;"`.)

### 3. Configure environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env
```

- `DATABASE_URL` — point it at your local database. A default Homebrew install
  has no password and uses your system username, e.g.
  `postgresql://yourname@localhost:5432/inkwell?schema=public`.
- `AUTH_SECRET` — generate one with `openssl rand -base64 32`.
- `AUTH_URL` / `NEXTAUTH_URL` — leave as `http://localhost:3000` for local dev.

### 4. Run migrations

This creates the tables, the full-text search column, its GIN index, and the
trigger that keeps the search vector up to date:

```bash
npm run db:deploy      # apply existing migrations
npm run db:generate    # generate the Prisma client
```

### 5. Seed sample data

```bash
npm run db:seed
```

This creates four authors and a dozen posts (one left as a draft) plus comments,
likes, and bookmarks.

**Sample logins** — all use the password `password123`:

| Email               | Username |
| ------------------- | -------- |
| `maya@inkwell.test` | maya     |
| `theo@inkwell.test` | theo     |
| `ren@inkwell.test`  | ren      |
| `amara@inkwell.test`| amara    |

### 6. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

## Project structure

```
prisma/
  schema.prisma         Data model (User, Post, Comment, Like, Bookmark, Tag, Category)
  migrations/           SQL migrations incl. the FTS trigger + GIN index
  seed.ts               Realistic sample data
public/
  uploads/              Uploaded images land here (gitignored)
src/
  app/                  App Router pages + API route handlers
    api/                REST endpoints (posts, comments, likes, bookmarks,
                        search, uploads, auth, me, users, categories, tags)
  components/           UI primitives, editor, feed, navbar, forms, motion
  lib/                  Prisma client, auth helpers, validation, sanitize,
                        slug, read-time, rate-limit, query helpers
  auth.ts               Auth.js (Node) — Credentials authorize
  auth.config.ts        Auth.js (edge-safe) — callbacks + route protection
  middleware.ts         Route protection
```

## Available scripts

| Script               | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start the dev server                  |
| `npm run build`      | Production build                      |
| `npm run start`      | Run the production build              |
| `npm run lint`       | Lint                                  |
| `npm run db:migrate` | Create + apply a new migration (dev)  |
| `npm run db:deploy`  | Apply existing migrations             |
| `npm run db:generate`| Generate the Prisma client            |
| `npm run db:seed`    | Seed sample data                      |
| `npm run db:studio`  | Open Prisma Studio                    |
| `npm run db:reset`   | Drop, re-migrate, and re-seed         |

## Security notes

- Passwords are hashed with **argon2id** and never logged or returned.
- All user-submitted HTML is **sanitized** (DOMPurify) before storage to prevent
  stored XSS.
- Every mutating route enforces **server-side authorization** and **Zod**
  validation; login, sign-up, and commenting are **rate-limited**.
- Database access is **parameterized** via Prisma — no string-concatenated SQL.
