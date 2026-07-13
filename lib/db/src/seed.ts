import { db, pool } from "./index";
import {
  usersTable,
  brandsTable,
  adsTable,
  questionsTable,
  pointsLedgerTable,
  reviewSessionsTable,
  eventsLogTable,
  EVENT_TYPES,
} from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function findOrCreateUser(values: {
  email: string;
  passwordHash: string;
  username: string;
  role: "reviewer" | "brand" | "admin";
}) {
  const [inserted] = await db
    .insert(usersTable)
    .values(values)
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, values.email))
    .limit(1);

  return existing!;
}

async function seed() {
  console.log("🌱 Seeding AdSpot database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await findOrCreateUser({
    email: "admin@adspot.demo",
    passwordHash,
    username: "admin",
    role: "admin",
  });
  console.log("✓ Admin user created");

  const brandUser1 = await findOrCreateUser({
    email: "brand1@acmecorp.demo",
    passwordHash,
    username: "acmecorp",
    role: "brand",
  });

  const brandUser2 = await findOrCreateUser({
    email: "brand2@techwave.demo",
    passwordHash,
    username: "techwave",
    role: "brand",
  });

  const [existingBrand1] = await db
    .insert(brandsTable)
    .values({
      userId: brandUser1.id,
      companyName: "Acme Corp",
      website: "https://acme.demo",
    })
    .onConflictDoNothing()
    .returning();

  const brand1 =
    existingBrand1 ??
    (await db.select().from(brandsTable).where(eq(brandsTable.userId, brandUser1.id)).limit(1).then(([r]) => r!));

  const [existingBrand2] = await db
    .insert(brandsTable)
    .values({
      userId: brandUser2.id,
      companyName: "TechWave",
      website: "https://techwave.demo",
    })
    .onConflictDoNothing()
    .returning();

  const brand2 =
    existingBrand2 ??
    (await db.select().from(brandsTable).where(eq(brandsTable.userId, brandUser2.id)).limit(1).then(([r]) => r!));

  console.log("✓ Brand profiles created");

  const reviewerData = [
    { email: "alice@reviewer.demo", username: "alice_reviews" },
    { email: "bob@reviewer.demo", username: "bob_watches" },
    { email: "carol@reviewer.demo", username: "carol_critic" },
    { email: "david@reviewer.demo", username: "david_rate" },
    { email: "eve@reviewer.demo", username: "eve_eagle" },
    { email: "frank@reviewer.demo", username: "frank_fan" },
    { email: "grace@reviewer.demo", username: "grace_gem" },
    { email: "henry@reviewer.demo", username: "henry_hawk" },
    { email: "iris@reviewer.demo", username: "iris_insight" },
    { email: "jack@reviewer.demo", username: "jack_judge" },
  ];

  const reviewers = [];
  for (const r of reviewerData) {
    const reviewer = await findOrCreateUser({ ...r, passwordHash, role: "reviewer" });
    reviewers.push(reviewer);
  }
  console.log(`✓ ${reviewers.length} reviewer accounts created`);

  const existingAds = await db
    .select({ id: adsTable.id })
    .from(adsTable)
    .where(eq(adsTable.brandId, brand1.id))
    .limit(1);

  if (existingAds.length > 0) {
    console.log("Ads already exist, skipping ad creation");
    await pool.end();
    return;
  }

  const [ad1] = await db
    .insert(adsTable)
    .values({
      brandId: brand1.id,
      title: "Acme Widget Pro — Summer Launch",
      description: "Introducing our revolutionary Widget Pro. Lighter, faster, smarter.",
      assetUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      assetType: "image",
      minWatchSeconds: 10,
      pointReward: 15,
      multiplierFactor: "1.0",
      status: "active",
    })
    .returning();

  const [ad2] = await db
    .insert(adsTable)
    .values({
      brandId: brand1.id,
      title: "Acme Home Edition — New Features",
      description: "Discover what's new in Acme Home Edition 2026.",
      assetUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      assetType: "image",
      minWatchSeconds: 15,
      pointReward: 20,
      multiplierFactor: "1.5",
      status: "active",
    })
    .returning();

  const [ad3] = await db
    .insert(adsTable)
    .values({
      brandId: brand2.id,
      title: "TechWave Cloud Platform",
      description: "Scale your startup with TechWave's cloud-native platform.",
      assetUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
      assetType: "image",
      minWatchSeconds: 20,
      pointReward: 25,
      multiplierFactor: "2.0",
      status: "active",
    })
    .returning();

  const [ad4] = await db
    .insert(adsTable)
    .values({
      brandId: brand2.id,
      title: "TechWave Mobile SDK Beta",
      description: "Join our beta program for the most powerful mobile SDK.",
      assetUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
      assetType: "image",
      minWatchSeconds: 15,
      pointReward: 30,
      multiplierFactor: "1.0",
      status: "active",
    })
    .returning();

  await db.insert(adsTable).values({
    brandId: brand1.id,
    title: "Acme Enterprise Suite — Draft",
    description: "Coming soon: Acme for Enterprise.",
    assetUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    assetType: "image",
    minWatchSeconds: 30,
    pointReward: 50,
    multiplierFactor: "1.0",
    status: "draft",
  });

  console.log("✓ 5 demo ads created");

  const adQuestions: Array<{
    adId: string;
    questions: Array<{ qt: "multiple_choice" | "rating" | "open_text" | "emoji" | "yes_no"; text: string; opts?: string[] }>;
  }> = [
    {
      adId: ad1.id,
      questions: [
        { qt: "rating", text: "How would you rate this ad overall? (1-5)" },
        { qt: "multiple_choice", text: "Which feature interests you most?", opts: ["Speed", "Design", "Price", "Durability"] },
        { qt: "yes_no", text: "Would you share this product with a friend?" },
        { qt: "emoji", text: "How did this ad make you feel?", opts: ["😀", "😐", "😕", "❤️", "🤔"] },
        { qt: "open_text", text: "What would make this product better for you?" },
      ],
    },
    {
      adId: ad2.id,
      questions: [
        { qt: "rating", text: "Rate the ad quality (1-10)" },
        { qt: "multiple_choice", text: "Which new feature excites you most?", opts: ["Speed boost", "New UI", "More storage", "Better security"] },
        { qt: "yes_no", text: "Are you a current Acme Home Edition user?" },
        { qt: "open_text", text: "What feature would you add to Acme Home Edition?" },
      ],
    },
    {
      adId: ad3.id,
      questions: [
        { qt: "rating", text: "How relevant is this ad to your needs? (1-5)" },
        { qt: "multiple_choice", text: "What cloud services does your team currently use?", opts: ["AWS", "Google Cloud", "Azure", "Other", "None"] },
        { qt: "yes_no", text: "Does your company currently use cloud infrastructure?" },
        { qt: "emoji", text: "How do you feel about the pricing mentioned?", opts: ["💰", "👍", "😐", "😬"] },
        { qt: "open_text", text: "What's your biggest cloud challenge right now?" },
      ],
    },
    {
      adId: ad4.id,
      questions: [
        { qt: "yes_no", text: "Are you a mobile app developer?" },
        { qt: "rating", text: "How likely are you to try the beta? (1-10)" },
        { qt: "multiple_choice", text: "Which platform do you develop for?", opts: ["iOS", "Android", "Both", "Neither"] },
      ],
    },
  ];

  for (const { adId, questions } of adQuestions) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      await db.insert(questionsTable).values({
        adId,
        sortOrder: i,
        questionType: q.qt,
        questionText: q.text,
        options: q.opts ?? null,
      });
    }
  }
  console.log("✓ Questions added to ads");

  if (reviewers.length > 0) {
    const ads = [ad1, ad2, ad3, ad4];
    const pointAmounts = [15, 20, 25, 30, 40, 12, 18, 22, 28, 35];

    for (let i = 0; i < reviewers.length; i++) {
      const reviewer = reviewers[i]!;
      const numReviews = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < numReviews; j++) {
        const ad = ads[(i + j) % ads.length]!;
        const pointsAwarded = pointAmounts[(i + j) % pointAmounts.length]!;

        const [session] = await db
          .insert(reviewSessionsTable)
          .values({
            userId: reviewer.id,
            adId: ad.id,
            status: "completed",
            completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            watchSeconds: 20 + Math.floor(Math.random() * 40),
            pointsAwarded,
          })
          .returning();

        await db.insert(pointsLedgerTable).values({
          userId: reviewer.id,
          amount: pointsAwarded,
          source: "review",
          referenceId: session.id,
          description: `Completed review for "${ad.title}"`,
        });

        await db.insert(eventsLogTable).values({
          eventType: EVENT_TYPES.REVIEW_SUBMITTED,
          actorId: reviewer.id,
          entityType: "review_session",
          entityId: session.id,
          metadata: { adId: ad.id, pointsAwarded },
        });
      }
    }
    console.log("✓ Demo review sessions and points seeded");
  }

  console.log("✅ Database seeded successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
