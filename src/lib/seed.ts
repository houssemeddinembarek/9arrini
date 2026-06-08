/**
 * Seed script — run with: npx ts-node src/lib/seed.ts
 * Or add to package.json: "seed": "ts-node -r tsconfig-paths/register src/lib/seed.ts"
 */
import { connectDB } from "./mongodb";
import User from "@/models/User";
import Course from "@/models/Course";

const DEMO_USERS = [
  { name: "Demo Student", email: "student@demo.com", password: "demo1234", role: "student" as const, isVerified: true, xp: 450, level: 3 },
  { name: "Demo Teacher", email: "teacher@demo.com", password: "demo1234", role: "teacher" as const, isVerified: true },
  { name: "Admin User", email: "admin@demo.com", password: "demo1234", role: "admin" as const, isVerified: true },
];

async function seed() {
  await connectDB();
  console.log("Connected to MongoDB");

  // Clear existing demo users
  await User.deleteMany({ email: { $in: DEMO_USERS.map((u) => u.email) } });
  console.log("Cleared existing demo users");

  // Create demo users
  for (const userData of DEMO_USERS) {
    const user = await User.create(userData);
    console.log(`Created ${user.role}: ${user.email}`);
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\nDemo accounts:");
  DEMO_USERS.forEach((u) => console.log(`  ${u.role}: ${u.email} / ${u.password}`));

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
