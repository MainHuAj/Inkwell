# Build Brief: A Multi-User Blogging Platform

*Next.js + PostgreSQL  |  full-stack, production-grade, written for the engineer building it*

## Context and Role

I'm building a blogging platform and I want you to take it from an empty repo to something I'd actually be proud to put in front of people. You're the founding engineer on this, not a contractor working off a ticket. You own the whole thing — how a post feels to read, how the editor behaves when someone's four paragraphs deep and pasting in an image, and the database underneath that stays quick as the posts and comments pile up. All of it.

Here's the one structural fact that colours everything else: this is a flat, multi-author site. Anybody who signs up is a full author *and* a full reader. No editor-in-chief, no approval queue, no "please review my draft" gate. If you're logged in, you can write, publish, comment, like, and bookmark. Keep that in your head, because it quietly decides a lot of the smaller calls down the line.

And be honest with yourself about quality as you go. The frontend can't look like a tutorial. I mean typography and spacing that make someone want to keep scrolling, not a wall of default Tailwind. The backend, on the other hand, should be boring in the best possible way: predictable, secure, and still readable to me six months from now when I've forgotten how any of it works.

## Objective

Ship a production-ready blogging website where a signed-in person can do the obvious things without friction:

- Sign up and log in with an email and password — nothing fancier than that, but done properly.
- Write posts in a real rich-text editor, drop images into the body, save drafts, and hit publish only when they're ready.
- Read everyone else's posts in a clean, fast layout that gets out of the way.
- Comment on posts, like the good ones, and bookmark the ones worth returning to.
- Find things — through tags, categories, and a search box that actually works.

All of it sits on PostgreSQL and runs on Next.js end to end, entirely on my own machine — I'm not deploying this anywhere, so don't drag in hosting providers, serverless workarounds, or external services that only exist to solve a deployment problem I don't have. If a feature can't survive a real user being slightly careless, it isn't done.

## UI and Animation Requirements

The look matters more than people admit for a blog — reading is the entire product, so the reading experience is the design. Aim for an editorial, magazine-ish feel: generous line height, a real type scale, comfortable measure (roughly 65–75 characters a line for body text), and a light/dark mode that remembers what I picked.

Motion should be present but restrained. I'm not after a parallax circus. Subtle fade-and-rise as cards enter the viewport, a smooth page-to-page feel, the composer transitioning in cleanly — that kind of thing. Use Framer Motion, lean on transform and opacity so the GPU does the work, and respect prefers-reduced-motion for anyone who's turned animations off. If an animation ever fights the scroll, kill it.

### Layout Requirements

At minimum the site needs these surfaces, and each should feel deliberate rather than auto-generated:

- A home / feed page listing published posts — cover image, title, author, read time, tags, and a likes count. The feed is ordered newest-published-first by default. Use cursor-based pagination with a "Load more" control (not infinite scroll), 10 posts per load, so the feed stays predictable and snappy past a few hundred entries and the back button behaves sanely.
- An individual post page: big readable title, author byline with avatar, the rendered body, tags, like and bookmark buttons, and the comment thread underneath.
- The composer / editor screen where writing and editing actually happen.
- A personal dashboard where I can see my own posts split into Drafts and Published, plus my bookmarks.
- A public profile page per user showing their published posts and a short bio.
- Auth screens (sign up, log in, the usual) that don't look like an afterthought.

Everything responsive across phone, tablet, and desktop — and I do mean tested on a real narrow screen, not just resized in dev tools. Use semantic HTML, label things for screen readers, keep focus states visible, and make sure the whole thing is keyboard-navigable. Accessibility isn't a bonus round here.

## Authentication and Account Requirements

Email and password only. No social login, no magic links — keep the surface small and get the fundamentals right instead of spreading thin.

- Hash passwords with **argon2 (argon2id)**. Never store plaintext, never log a password, not even once while debugging. Since this runs locally with no serverless build to break, use argon2id outright — it's the memory-hard algorithm OWASP currently recommends, and the native module is a non-issue on a real machine.
- Sessions handled by **Auth.js (NextAuth v5)** with its Credentials provider, using secure, httpOnly cookies. I'd rather lean on a maintained library that already gets CSRF protection, cookie flags, and session rotation right than hand-roll JWT plumbing and quietly ship a hole.
- Standard flows: register, log in, log out, and a way to update profile basics like display name, bio, and avatar.
- Protect the routes that need protecting. A logged-out visitor can read posts and profiles, but writing, commenting, liking, and bookmarking all require an account.
- Validate on both ends — email format, password length, the works — and return clear errors, not generic 500s.

## Content System Requirements

This is the heart of the app, so it gets the most detail. Three buckets: writing/publishing, the social layer, and discovery.

### Writing and Publishing

- Use **Tiptap** as the editor (rich-text, built on ProseMirror). It must support bold, italic, headings, links, ordered and unordered lists, code blocks, and blockquotes at minimum. I picked Tiptap over a plain Markdown textarea because it's WYSIWYG without locking us in — it serialises to clean HTML or JSON, it's headless so it inherits our own styling instead of fighting it, and image embedding is a first-class extension rather than a hack.
- Image uploads inside the body and as a cover image, written to the **local filesystem** — a dedicated uploads folder served by Next.js — with only the resulting path stored in Postgres, never the binary. Local storage is the locked choice precisely because this runs on my machine: there's no ephemeral serverless disk to lose files to, so there's no excuse to pull in Cloudinary or an S3 bucket. Generate a unique filename for each upload so two 'photo.png' files don't clobber each other (allowed types and size limits are defined under Data Processing).
- Draft and Published states. Drafts are private to the author and never show up in feeds, search, or profiles. Publishing flips the state and stamps a published-at time.
- Let authors edit and delete their own posts. Editing a published post shouldn't nuke its comments or likes.
- Auto-generate a clean URL slug from the title, and handle the duplicate-title case gracefully.
- Compute and show an estimated read time. Small touch, but it's the kind of thing that makes it feel finished.

### Comments, Likes, and Bookmarks

- Logged-in users can comment on any published post. Comments display oldest-first, the way a conversation reads. Show the author, avatar, and a relative timestamp ("3 hours ago").
- People can edit or delete their own comments; deleting a comment shouldn't break the layout of the rest of the thread.
- Likes are a simple toggle — one like per user per post, and the count updates without a full page reload.
- Bookmarks are private. A user saves a post, it lands in their bookmarks list, nobody else sees it.
- Threaded replies aren't required for v1, but don't paint yourself into a corner that makes adding them later painful.

### Tags, Categories, and Search

- Categories are a small fixed set defined in seed/config (think Tech, Life, Culture — a handful, not a free-for-all), and an author picks exactly one when publishing. Tags are freeform: the author types their own, and you dedupe them case-insensitively so 'NextJS' and 'nextjs' don't split into two.
- Clicking a tag or a category filters the feed down to matching posts.
- A search box that queries both post titles and body text. Postgres full-text search is plenty — you don't need to bolt on Elasticsearch for this.
- Search and tag pages should handle the empty case nicely (a real "nothing here yet" state, not a blank screen).

## Backend Requirements

Build the API with Next.js **route handlers** in the App Router — not server actions. Route handlers give a real, inspectable REST surface I can hit with curl or Postman, version, and rate-limit cleanly; server actions blur the client/server line in a way that gets awkward the moment you want a genuine API contract. Consistency of that contract is the thing I actually care about.

- RESTful, predictable endpoints for posts, comments, likes, bookmarks, auth, and users. Same shape for the same kind of response across the board.
- Talk to Postgres through **Prisma**, with migrations checked into the repo so a fresh clone spins up the full schema in one command. Prisma over Drizzle here purely for the developer experience: the generated types, the migration tooling, and the Studio GUI make the data layer hard to get wrong, which matters more than shaving a few milliseconds.
- A sane relational schema: users, posts, comments, tags, categories, likes, bookmarks, and the join tables to connect them. Foreign keys and the right indexes — especially on whatever the feed and search hit most.
- Config (the local Postgres connection string, the Auth.js secret) lives in environment variables, not hardcoded, with a committed .env.example so I know what to fill in.
- Authorization checks server-side on every mutating route. Never trust the client to tell you who someone is or what they're allowed to touch.
- Rate-limit the noisy endpoints — login attempts, comment posting, sign-ups — so the site isn't trivial to hammer.

## Data Processing Requirements

Treat every byte that comes from a user as hostile until proven otherwise. That's not paranoia, it's just the job.

- Sanitize and escape all user content. The editor's HTML output especially — strip dangerous tags and attributes so a post or comment can't smuggle in a script. No stored XSS.
- Parameterized queries everywhere (the ORM gives you this for free, so don't go writing raw string-concatenated SQL and undo it).
- Validate input with **Zod** on the server, even when the client already checked. The client is a suggestion; the server is the law.
- Validate email format properly and normalise it (trim, lowercase) before it hits the database.
- Enforce concrete limits and reject anything over them with a clear message: post titles up to 120 characters, post body up to 50,000 characters, comments up to 2,000 characters, and image uploads restricted to JPEG, PNG, WebP, or GIF at 5 MB max each.
- Every API response is structured JSON: a clear success payload, or a clear error with a message and an appropriate status code. No half-empty 200s pretending everything's fine.

## Output Requirements

When it's done, here's what I should be able to do without reading the code:

- Sign up, log in, and land on a feed that actually has content in it (seed some realistic sample data — a few users, a dozen posts, some comments).
- Write a post in the editor, add an image, save it as a draft, come back, and publish it.
- See that published post appear in the feed and on my profile, and confirm the draft never leaked anywhere public.
- Comment, like, and bookmark on someone else's post and watch the counts and lists update.
- Filter by a tag, open a category, and run a search that returns the right posts.
- Get clean confirmation when something works and a clear, human error message when it doesn't.

## Error Handling and Documentation

- Handle frontend errors like a grown-up app: inline form validation, loading states, disabled buttons mid-request, and friendly messages on failure — never a raw stack trace in the user's face.
- Backend validation errors come back structured, with the right HTTP status (400 for bad input, 401/403 for auth, 404 for missing, 500 only for genuine surprises).
- Log server failures somewhere I can actually find them, with enough context to debug — but never log passwords, tokens, or full payloads of personal data.
- Write a README that doesn't make me reverse-engineer the project. It should cover: the folder structure and why it's laid out that way, and how to run the whole thing locally end to end — installing or spinning up Postgres, every environment variable and what it's for, running the Prisma migrations, seeding the sample data, and starting the dev server. No deployment section; this lives on my machine.

## Performance and Scalability

- Lean on Next.js properly — server components, sensible caching, and static or incremental rendering for pages that don't need to be dynamic on every hit.
- Lazy-load the heavy stuff (the editor, the image-handling bits) so the first paint stays quick.
- Optimize images: proper sizing, modern formats, the next/image component where it fits.
- Index the database around the queries that run most — the feed sort, search, and the lookups by author and by tag.
- Paginate or cursor-through long lists. Never ship an endpoint that says "SELECT everything" and hopes for the best.
- Debounce the search input and any other chatty interaction so you're not firing a request per keystroke.
- Keep the bundle honest — check what's actually being shipped to the client and trim what doesn't need to be there. Fast first paint and a responsive editor are the goals; since this isn't going public, skip the SEO/Open Graph/sitemap work entirely.

## Technology Stack

These are decisions, not suggestions. Don't substitute. If you think one is wrong, raise it with me before you swap it — don't just quietly pick something else.

### Frontend

- **Next.js 14+ (App Router), React, TypeScript.** One framework for the UI and the API, server components to keep the client bundle lean, and TypeScript so the data shapes are checked end to end instead of blowing up at runtime.
- **Tailwind CSS** for styling. Utility-first keeps the styling next to the markup and kills the dead-CSS problem — and it pairs directly with the component layer below.
- **shadcn/ui** for the component layer (required, not optional). You copy the components into the repo and own them, so there's no opaque dependency to fight when I want something to look a specific way. It rides on Tailwind, so it costs nothing extra to adopt.
- **Framer Motion** for the motion described earlier. It's the most mature animation library for React and it does transform/opacity-based animation and reduced-motion handling without me hand-writing keyframes.
- **Tiptap** for the post editor — headless and ProseMirror-based; the full reasoning is in the Content section.

### Backend

- **Next.js route handlers (App Router)** for the API, not server actions — reasoning is in the Backend Requirements section.
- **Prisma** as the ORM, with migrations committed to the repo (see Backend Requirements).
- **Auth.js (NextAuth v5)** with the Credentials provider for email/password sessions over secure httpOnly cookies (see Authentication and Account Requirements).
- **Zod** for request validation; **argon2 (argon2id)** for password hashing (see Authentication and Account Requirements).

### Database and Storage

- **PostgreSQL, run locally** as the only datastore — a native install or a one-line Docker container, whichever you prefer to document. No hosted provider: Neon, Supabase, and Railway all solve a deployment problem I deliberately don't have.
- **Postgres native full-text search** (tsvector / tsquery with a GIN index) for the search feature — no external search service, as covered in the Tags, Categories, and Search section.
- **Local filesystem** for all image storage, served by Next.js, as locked in the Content section — no external storage service.

### Optional, if time allows

- A small admin view for me to clean up spam, since there's no moderation queue by design.
