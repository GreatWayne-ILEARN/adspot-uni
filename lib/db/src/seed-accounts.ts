/**
 * seed-accounts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent seed script for all AdSpot demo/test accounts.
 * Safe to re-run — uses ON CONFLICT DO NOTHING throughout.
 *
 * Accounts created:
 *   SUPER ADMIN  oadeagbo@gmail.com       / password123  (owner — change password on first login)
 *   ADMIN        admin@adspot.demo        / password123
 *   BRANDS       <brand>@adspot.demo      / password123  (14 Nigerian brands)
 *   REVIEWERS    alice–jack @reviewer.demo / password123
 *
 * Run:  pnpm --filter @workspace/db seed:accounts
 */
import { db, pool } from "./index";
import { usersTable, brandsTable } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const PASSWORD = "password123";

async function upsertUser(values: {
  email: string;
  username: string;
  role: "reviewer" | "brand" | "admin" | "super_admin";
  passwordHash: string;
}) {
  const [inserted] = await db.insert(usersTable).values(values).onConflictDoNothing().returning();
  if (inserted) return inserted;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, values.email)).limit(1);
  return existing!;
}

async function upsertBrand(userId: string, companyName: string, website?: string) {
  await db.insert(brandsTable).values({ userId, companyName, website: website ?? null }).onConflictDoNothing();
}

async function main() {
  console.log("🌱  Seeding AdSpot accounts...\n");
  const hash = await bcrypt.hash(PASSWORD, 12);

  // ── Super Admin ────────────────────────────────────────────────────────────
  const superAdmin = await upsertUser({
    email: "oadeagbo@gmail.com",
    username: "oadeagbo",
    role: "super_admin",
    passwordHash: hash,
  });
  console.log(`✓  SUPER ADMIN  oadeagbo@gmail.com  (id: ${superAdmin.id}) — owner account`);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await upsertUser({
    email: "admin@adspot.demo",
    username: "admin",
    role: "admin",
    passwordHash: hash,
  });
  console.log(`✓  ADMIN        admin@adspot.demo       (id: ${admin.id})`);

  // ── Nigerian Brand Accounts ────────────────────────────────────────────────
  const nigerianBrands = [
    { email: "mtn@adspot.demo",          username: "mtn_ng",        company: "MTN Nigeria",                  site: "https://mtn.com.ng" },
    { email: "gtbank@adspot.demo",        username: "gtbank_ng",      company: "GTBank Nigeria",               site: "https://gtbank.com" },
    { email: "flutterwave@adspot.demo",   username: "flutterwave",    company: "Flutterwave",                  site: "https://flutterwave.com" },
    { email: "paystack@adspot.demo",      username: "paystack",       company: "Paystack",                     site: "https://paystack.com" },
    { email: "dangote@adspot.demo",       username: "dangote_grp",    company: "Dangote Group",                site: "https://dangote.com" },
    { email: "jumia@adspot.demo",         username: "jumia_ng",       company: "Jumia Nigeria",                site: "https://jumia.com.ng" },
    { email: "airtel@adspot.demo",        username: "airtel_ng",      company: "Airtel Nigeria",               site: "https://ng.airtel.com" },
    { email: "guinness@adspot.demo",      username: "guinness_ng",    company: "Guinness Nigeria",             site: "https://guinness.com" },
    { email: "indomie@adspot.demo",       username: "indomie_ng",     company: "Indomie Nigeria",              site: "https://indomie.com.ng" },
    { email: "peakmilk@adspot.demo",      username: "peak_milk",      company: "Peak Milk (FrieslandCampina)", site: "https://peakmilk.com.ng" },
    { email: "safeboda@adspot.demo",      username: "safeboda_ng",    company: "SafeBoda Nigeria",             site: "https://safeboda.com" },
    { email: "clubbeer@adspot.demo",      username: "club_beer_ng",   company: "Club Beer (Nigerian Breweries)", site: "https://nbplc.com" },
    { email: "legend@adspot.demo",        username: "legend_extra",   company: "Legend Extra Stout",           site: "https://nbplc.com" },
    { email: "brand1@acmecorp.demo",      username: "acmecorp",       company: "Acme Corp",                    site: "https://acme.demo" },
    { email: "brand2@techwave.demo",      username: "techwave",       company: "TechWave",                     site: "https://techwave.demo" },
  ];

  for (const b of nigerianBrands) {
    const user = await upsertUser({ email: b.email, username: b.username, role: "brand", passwordHash: hash });
    await upsertBrand(user.id, b.company, b.site);
    console.log(`✓  BRAND        ${b.email.padEnd(32)} → ${b.company}`);
  }

  // ── Reviewer Accounts ──────────────────────────────────────────────────────
  const reviewers = [
    { email: "alice@reviewer.demo",   username: "alice_reviews" },
    { email: "bob@reviewer.demo",     username: "bob_watches" },
    { email: "carol@reviewer.demo",   username: "carol_critic" },
    { email: "david@reviewer.demo",   username: "david_rate" },
    { email: "eve@reviewer.demo",     username: "eve_eagle" },
    { email: "frank@reviewer.demo",   username: "frank_fan" },
    { email: "grace@reviewer.demo",   username: "grace_gem" },
    { email: "henry@reviewer.demo",   username: "henry_hawk" },
    { email: "iris@reviewer.demo",    username: "iris_insight" },
    { email: "jack@reviewer.demo",    username: "jack_judge" },
  ];

  for (const r of reviewers) {
    const user = await upsertUser({ ...r, role: "reviewer", passwordHash: hash });
    console.log(`✓  REVIEWER     ${r.email.padEnd(32)} (id: ${user.id})`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Accounts seed complete!

All accounts use password: ${PASSWORD}

SUPER ADMIN
  superadmin@adspot.demo

ADMIN
  admin@adspot.demo

BRANDS (${nigerianBrands.length})
  mtn@adspot.demo, gtbank@adspot.demo, flutterwave@adspot.demo,
  paystack@adspot.demo, dangote@adspot.demo, jumia@adspot.demo,
  airtel@adspot.demo, guinness@adspot.demo, indomie@adspot.demo,
  peakmilk@adspot.demo, safeboda@adspot.demo, clubbeer@adspot.demo,
  legend@adspot.demo, brand1@acmecorp.demo, brand2@techwave.demo

REVIEWERS (${reviewers.length})
  alice, bob, carol, david, eve, frank, grace, henry, iris, jack
  all at @reviewer.demo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  await pool.end();
}

main().catch((err) => {
  console.error("Account seed failed:", err);
  process.exit(1);
});
