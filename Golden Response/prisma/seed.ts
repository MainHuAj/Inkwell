import { PrismaClient, PostStatus } from "@prisma/client";
import argon2 from "argon2";
import { CATEGORIES } from "../src/lib/categories";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

const ARGON_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

function estimateReadMinutes(text: string) {
  return Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 225));
}

function htmlToPlain(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(text: string, max = 280) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).trim() + "…";
}

const USERS = [
  {
    email: "maya@inkwell.test",
    username: "maya",
    name: "Maya Lindqvist",
    bio: "Frontend engineer who cares too much about kerning and keyboard shortcuts.",
    avatarUrl: "https://i.pravatar.cc/200?img=47",
  },
  {
    email: "theo@inkwell.test",
    username: "theo",
    name: "Theo Okonkwo",
    bio: "Backend generalist. I write about databases, distributed systems, and good coffee.",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
  },
  {
    email: "ren@inkwell.test",
    username: "ren",
    name: "Ren Castellano",
    bio: "Designer-turned-developer. Slow mornings, long walks, longer essays.",
    avatarUrl: "https://i.pravatar.cc/200?img=32",
  },
  {
    email: "amara@inkwell.test",
    username: "amara",
    name: "Amara Devlin",
    bio: "Science writer. Curious about everything, certain about little.",
    avatarUrl: "https://i.pravatar.cc/200?img=5",
  },
];

type SeedPost = {
  authorUsername: string;
  title: string;
  category: string;
  tags: string[];
  cover?: string;
  status?: PostStatus;
  html: string;
};

const POSTS: SeedPost[] = [
  {
    authorUsername: "maya",
    title: "The Quiet Power of a 65-Character Line",
    category: "tech",
    tags: ["Typography", "CSS", "Design"],
    cover: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=80",
    html: `<p>There's a number that good typographers reach for again and again: roughly 65 characters per line. Not 40, not 120 — about 65. It's the width at which your eye can sweep to the end of a line and snap back to the start of the next without losing its place.</p><h2>Why it works</h2><p>Reading is a series of small jumps called <em>saccades</em>. When lines get too long, the return sweep overshoots. Too short, and you're constantly resetting. The 65-character measure sits in the comfortable middle.</p><blockquote>Anything that the reader doesn't notice is the design working.</blockquote><p>In CSS the trick is almost embarrassingly simple:</p><pre><code>article { max-width: 65ch; }</code></pre><p>The <code>ch</code> unit is the width of the "0" glyph in the current font, so it tracks your type automatically. Ship that one line and your prose suddenly feels editorial.</p>`,
  },
  {
    authorUsername: "theo",
    title: "Indexes Are a Promise You Make to Future-You",
    category: "tech",
    tags: ["PostgreSQL", "Databases", "Performance"],
    cover: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&q=80",
    html: `<p>Every index you add is a bet. You're wagering write performance and disk space against the read queries you expect to run. The mistake juniors make isn't adding too few indexes — it's adding them blindly.</p><h2>Index what you filter and sort</h2><p>The feed on this very site sorts published posts newest-first. That's a composite index on <code>(status, publishedAt DESC)</code> — not two separate indexes, one composite, in that order.</p><ul><li>Filter columns come first.</li><li>Sort columns come next, with direction.</li><li>Everything else is noise.</li></ul><p>Run <code>EXPLAIN ANALYZE</code> before and after. If the planner still does a sequential scan, your index isn't earning its keep.</p>`,
  },
  {
    authorUsername: "ren",
    title: "On Writing Slowly",
    category: "life",
    tags: ["Writing", "Craft", "Habits"],
    cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
    html: `<p>I used to think the goal was to write faster. More words, more posts, more output. Then I spent a winter writing one essay a month and noticed something: the slow pieces were the only ones anyone remembered.</p><p>Speed flattens. When you rush, you reach for the first phrasing that arrives, and the first phrasing is almost always a cliché someone else wore smooth.</p><h2>The compost pile</h2><p>Ideas need to sit. I keep a running document of half-thoughts and let them rot into something usable. By the time a line resurfaces three weeks later, it has earned its place.</p>`,
  },
  {
    authorUsername: "amara",
    title: "What a Total Eclipse Does to a Crowd",
    category: "science",
    tags: ["Astronomy", "Wonder"],
    cover: "https://images.unsplash.com/photo-1532798442725-41036acc7489?w=1200&q=80",
    html: `<p>I've now seen three total solar eclipses, and the most interesting thing isn't in the sky. It's the sound the crowd makes in the final ten seconds before totality.</p><p>It starts as nervous chatter. Then someone gasps. Then a strange collective hush as the temperature drops and the light goes wrong — not dim, exactly, but <em>colorless</em>, like the world's saturation slider got dragged to zero.</p><blockquote>For two minutes, a few thousand strangers forget to be self-conscious.</blockquote><p>Astronomers can predict the geometry to the second. Nobody can predict that hush. It gets me every time.</p>`,
  },
  {
    authorUsername: "maya",
    title: "Stop Animating Everything",
    category: "tech",
    tags: ["Animation", "UX", "Framer Motion"],
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
    html: `<p>Motion is seasoning, not the meal. The first thing people do when they discover an animation library is animate <strong>everything</strong>, and the result feels like a slot machine.</p><h2>A short rulebook</h2><ol><li>Animate <code>transform</code> and <code>opacity</code>. Let the GPU do the work.</li><li>Keep entrances under 400ms.</li><li>Respect <code>prefers-reduced-motion</code>. Always.</li><li>If an animation fights the scroll, kill it.</li></ol><p>The best motion is the kind a user feels but never consciously sees. A card that rises four pixels as it fades in. A page that doesn't jolt. Restraint reads as quality.</p>`,
  },
  {
    authorUsername: "theo",
    title: "Argon2, and Why You Should Never Roll Your Own Auth",
    category: "tech",
    tags: ["Security", "Auth", "PostgreSQL"],
    cover: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200&q=80",
    html: `<p>Hashing passwords sounds simple. It is not. The history of authentication is a graveyard of clever people who thought it was.</p><h2>Use a memory-hard hash</h2><p>Argon2id is the current OWASP recommendation. It's deliberately expensive in <em>memory</em>, which neuters the GPU rigs attackers use to brute-force fast hashes like a bare SHA-256.</p><p>And please — lean on a maintained session library. CSRF protection, secure cookie flags, session rotation: these are solved problems, and the solutions are subtle. Hand-rolled JWT plumbing is how holes ship.</p><blockquote>The most secure code is the code you didn't write.</blockquote>`,
  },
  {
    authorUsername: "ren",
    title: "The Case for a Boring Stack",
    category: "culture",
    tags: ["Engineering", "Culture"],
    cover: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
    html: `<p>Novelty has a cost, and we rarely put it on the invoice. Every shiny tool you adopt is a thing you now have to learn, debug at 2am, and explain to the next person who joins.</p><p>Boring technology is boring precisely because its failure modes are well-lit. PostgreSQL will not surprise you. That predictability is a feature, not a compromise.</p><h2>Spend your novelty budget wisely</h2><p>You get to be adventurous in maybe one part of the system. Pick the part that's actually your competitive edge, and make everything else as dull as possible.</p>`,
  },
  {
    authorUsername: "amara",
    title: "Tomatoes, Trust, and the Limits of a Headline",
    category: "science",
    tags: ["Science", "Media", "Writing"],
    cover: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1200&q=80",
    html: `<p>"Study finds tomatoes cure X." You've seen the headline. The study, when you find it, was eleven mice and a hopeful grad student.</p><p>Science communication breaks at the compression step. A paper says "associated with, under these conditions, in this model." A headline says "cures." Everything interesting lives in the words the headline threw away.</p><blockquote>Certainty is a marketing choice, not a scientific one.</blockquote><p>When I write about research now, I try to keep one honest hedge in the first paragraph. Readers can handle nuance. They just rarely get offered it.</p>`,
  },
  {
    authorUsername: "maya",
    title: "Dark Mode Is Not Just Inverted Colors",
    category: "tech",
    tags: ["Design", "CSS", "Accessibility"],
    cover: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&q=80",
    html: `<p>Flip a light theme to dark by inverting every color and you'll get something that looks like a photographic negative and hums with eye strain.</p><h2>What actually changes</h2><ul><li>Pure white text on pure black vibrates. Soften both ends.</li><li>Shadows mostly stop working — lean on subtle borders instead.</li><li>Saturated colors look louder on dark. Desaturate them a touch.</li></ul><p>Dark mode is a separate design, not a filter. Treat it like one and people will actually keep it on.</p>`,
  },
  {
    authorUsername: "theo",
    title: "Cursor Pagination, or How to Stop the Back Button Lying",
    category: "tech",
    tags: ["APIs", "PostgreSQL", "Performance"],
    cover: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&q=80",
    html: `<p>Offset pagination is fine until it isn't. <code>OFFSET 10000</code> makes Postgres count past ten thousand rows just to throw them away, and if someone publishes a post while you're paging, everything shifts by one and you see a duplicate.</p><h2>Cursors fix both</h2><p>Instead of "skip 10,000," you say "give me the 10 rows after <em>this</em> one." It's O(log n) against the index and it's stable under inserts. The feed here uses exactly this — a "Load more" button that passes the last post's id back as the cursor.</p>`,
  },
  {
    authorUsername: "ren",
    title: "A Draft Nobody Will Read (Yet)",
    category: "life",
    tags: ["Writing", "Meta"],
    status: PostStatus.DRAFT,
    html: `<p>This one's still cooking. I'm leaving it as a draft on purpose — it should never show up in the public feed, on my profile, or in search until I hit publish.</p><p>If you can see this and you're not me, something's broken.</p>`,
  },
  {
    authorUsername: "amara",
    title: "The Sky Is Falling (Slowly): Notes on Space Junk",
    category: "science",
    tags: ["Astronomy", "Engineering"],
    cover: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80",
    html: `<p>There are tens of thousands of trackable objects in orbit, and far more we can't see. Most are debris: dead satellites, spent rocket stages, flecks of paint moving at seven kilometers a second.</p><p>The nightmare scenario has a name — Kessler syndrome — where one collision spawns debris that causes the next, cascading until certain orbits become unusable for generations.</p><blockquote>We treated low Earth orbit like an attic. Now the attic is full.</blockquote>`,
  },
];

const COMMENTS = [
  { post: 0, by: "theo", body: "The ch unit tip alone was worth the read. Switching my blog tonight." },
  { post: 0, by: "amara", body: "I always eyeballed line length. Nice to have an actual number to aim for." },
  { post: 1, by: "maya", body: "Composite index order trips up everyone once. Good, concise explanation." },
  { post: 1, by: "ren", body: "EXPLAIN ANALYZE changed how I think about queries. Underrated tool." },
  { post: 3, by: "maya", body: "The hush! Saw the 2017 eclipse and you've described it exactly." },
  { post: 4, by: "theo", body: "‘Motion is seasoning, not the meal’ — stealing that line." },
  { post: 5, by: "ren", body: "Roll-your-own-auth horror stories should be required onboarding reading." },
  { post: 9, by: "amara", body: "The duplicate-post-on-insert bug bit me last month. Wish I'd read this first." },
];

async function main() {
  console.log("Seeding database…");

  // Clean slate (order respects foreign keys; cascades handle the rest).
  await prisma.like.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // Categories (fixed set).
  for (const c of CATEGORIES) {
    await prisma.category.create({ data: { name: c.name, slug: c.slug } });
  }
  const categoryBySlug = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  // Users — all share the password "password123" for easy local testing.
  const passwordHash = await argon2.hash("password123", ARGON_OPTS);
  const userByUsername = new Map<string, string>();
  for (const u of USERS) {
    const created = await prisma.user.create({
      data: { ...u, passwordHash },
    });
    userByUsername.set(u.username, created.id);
  }

  // Tags (deduped by slug).
  const tagIdBySlug = new Map<string, string>();
  async function tagId(name: string) {
    const slug = slugify(name);
    if (tagIdBySlug.has(slug)) return tagIdBySlug.get(slug)!;
    const tag = await prisma.tag.create({ data: { name, slug } });
    tagIdBySlug.set(slug, tag.id);
    return tag.id;
  }

  // Posts — stagger publishedAt so the feed has a believable timeline.
  const createdPosts: string[] = [];
  let dayOffset = POSTS.length;
  for (const p of POSTS) {
    const plain = htmlToPlain(p.html);
    const status = p.status ?? PostStatus.PUBLISHED;
    const publishedAt =
      status === PostStatus.PUBLISHED
        ? new Date(Date.now() - dayOffset * 36 * 60 * 60 * 1000)
        : null;

    const tagIds: string[] = [];
    for (const t of p.tags) tagIds.push(await tagId(t));

    const post = await prisma.post.create({
      data: {
        title: p.title,
        slug: slugify(p.title),
        contentHtml: p.html,
        excerpt: excerpt(plain),
        coverImage: p.cover ?? null,
        readMinutes: estimateReadMinutes(plain),
        status,
        publishedAt,
        authorId: userByUsername.get(p.authorUsername)!,
        categoryId: categoryBySlug.get(p.category) ?? null,
        tags: { create: tagIds.map((id) => ({ tagId: id })) },
      },
    });
    createdPosts.push(post.id);
    dayOffset--;
  }

  // Comments (oldest-first ordering is handled by createdAt at read time).
  for (const c of COMMENTS) {
    await prisma.comment.create({
      data: {
        body: c.body,
        postId: createdPosts[c.post],
        authorId: userByUsername.get(c.by)!,
      },
    });
  }

  // A scattering of likes and bookmarks.
  const usernames = [...userByUsername.keys()];
  const likePairs: Array<[number, string]> = [
    [0, "theo"], [0, "amara"], [0, "ren"],
    [1, "maya"], [1, "ren"],
    [3, "maya"], [3, "theo"], [3, "ren"],
    [4, "theo"], [4, "amara"], [4, "ren"], [4, "maya"],
    [5, "ren"], [5, "amara"],
    [9, "amara"], [9, "maya"],
  ];
  for (const [postIdx, by] of likePairs) {
    await prisma.like.create({
      data: { postId: createdPosts[postIdx], userId: userByUsername.get(by)! },
    });
  }

  await prisma.bookmark.createMany({
    data: [
      { postId: createdPosts[1], userId: userByUsername.get("maya")! },
      { postId: createdPosts[5], userId: userByUsername.get("maya")! },
      { postId: createdPosts[3], userId: userByUsername.get("theo")! },
    ],
  });

  console.log(
    `Done. ${USERS.length} users, ${POSTS.length} posts (1 draft), ` +
      `${COMMENTS.length} comments, ${likePairs.length} likes.`,
  );
  console.log("Log in with any of: maya@inkwell.test … / password123");
  void usernames;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
