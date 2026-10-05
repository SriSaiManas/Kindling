-- Kindling persistent storage for Supabase + Vercel
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.kindling_articles (
  id text primary key,
  article jsonb not null,
  created_at bigint not null
);

create index if not exists kindling_articles_created_at_idx
  on public.kindling_articles (created_at desc);

alter table public.kindling_articles enable row level security;

-- The Vercel API uses the Supabase secret key on the server, so browser
-- clients never receive database credentials. No public table policy is needed.

insert into public.kindling_articles (id, article, created_at)
values (
  'seed-bangalore-1',
  $$
  {
    "id": "seed-bangalore-1",
    "title": "How Jakkur Lake Became a Model for Community Waters",
    "tag": "water commons",
    "punchline": "wetlands and wastewater",
    "excerpt": "Ten years ago, Jakkur Lake was choked with debris. Today, it stands as Bangalore's circular water triumph.",
    "body": "## The return of the pelicans\n\nTen years ago, Jakkur Lake was choked with construction debris and untamed runoff. Today, it stands as one of Bangalore's most celebrated circular-water success stories — not because of top-down municipal decree alone, but through relentless neighborhood stewardship and an integrated natural wetland design.\n\nTreated water from the secondary STP flows first into a 4-hectare constructed wetland of typha reeds, water hyacinth and alligator weed before spilling into the main lake basin. The vegetation absorbs surplus nitrates and phosphates, yielding clean water that recharges open wells across the northern peri-urban belt.\n\n# The community behind the bund\n\nEvery Saturday at dawn, volunteers from Jalaposhan Trust walk the 4.2 km perimeter bund. School groups tally bird counts — over 190 species documented, including spot-billed pelicans and painted storks — while local fishermen maintain a regulated catch quota that prevents toxic algal blooms.\n\n_Sustainability is not a technology you buy;_ it is a social habit built around shared commons. When neighborhoods take ownership of their catchment, Bangalore’s historic cascading tank system begins to breathe again.",
    "color": "linear-gradient(155deg,#b0492f,#1c1916)",
    "icon": "spark",
    "author": "Alvin",
    "authorRole": "admin",
    "date": "today",
    "createdAt": 1700000000000,
    "image": null,
    "images": [],
    "draft": false
  }
  $$::jsonb,
  1700000000000
)
on conflict (id) do nothing;
