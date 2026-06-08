/* Seed script — run with: npx prisma db seed  (or: npm run db:seed)
 *
 * Production-safe & idempotent: it never deletes data. By default it seeds an
 * admin account (from env) and the securities catalog. Set SEED_DEMO=true to
 * also create the demo users/accounts used for local development.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const hash = (pw) => bcrypt.hashSync(pw, 10);

// Canonical securities catalog (admins can add more in-app).
const STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", assetType: "stock", price: 226.4, change: 1.32, available: 18420 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", assetType: "stock", price: 438.12, change: -0.45, available: 12030 },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", assetType: "stock", price: 121.78, change: 3.91, available: 26500 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", assetType: "stock", price: 201.55, change: 0.88, available: 9800 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Communication", assetType: "stock", price: 178.22, change: -1.12, available: 7600 },
  { symbol: "BRK.B", name: "Berkshire Hathaway", sector: "Financial", assetType: "stock", price: 466.9, change: 0.21, available: 3400 },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financial", assetType: "stock", price: 245.7, change: 0.64, available: 5200 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", assetType: "stock", price: 153.09, change: -0.33, available: 6100 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", sector: "Index Fund", assetType: "etf", price: 512.36, change: 0.42, available: 41000 },
  { symbol: "VTI", name: "Vanguard Total Market ETF", sector: "Index Fund", assetType: "etf", price: 287.91, change: 0.39, available: 38500 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", sector: "Index Fund", assetType: "etf", price: 558.12, change: 0.4, available: 52000 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "Index Fund", assetType: "etf", price: 478.55, change: 1.05, available: 33000 },
  { symbol: "SCHD", name: "Schwab US Dividend ETF", sector: "Index Fund", assetType: "etf", price: 27.84, change: 0.12, available: 29000 },
  { symbol: "BND", name: "Vanguard Total Bond ETF", sector: "Fixed Income", assetType: "bond", price: 73.45, change: -0.08, available: 21000 },
  { symbol: "TLT", name: "iShares 20+ Yr Treasury", sector: "Fixed Income", assetType: "bond", price: 94.2, change: -0.21, available: 14000 },
  { symbol: "GLD", name: "SPDR Gold Shares (ETF)", sector: "Commodity", assetType: "commodity_etf", price: 248.7, change: 0.77, available: 16500 },
  { symbol: "GOLDBAR", name: "Physical Gold Bullion", sector: "Collectible", assetType: "collectible", price: 2480.0, change: 0.55, available: 120 },
  { symbol: "ART-FUND", name: "Fine Art Holdings LP", sector: "Collectible", assetType: "collectible", price: 1500.0, change: 0.0, available: 45 },
  { symbol: "LIFE-INS", name: "Whole Life Insurance Co.", sector: "Insurance", assetType: "life_insurance", price: 1000.0, change: 0.0, available: 80 },
  { symbol: "USDC-T", name: "Stable Crypto Token", sector: "Digital Asset", assetType: "crypto", price: 1.0, change: 0.0, available: 90000 },
];

async function main() {
  // 1) Securities catalog (idempotent).
  await prisma.stock.createMany({ data: STOCKS, skipDuplicates: true });

  // Transfer insurance plans (admin-editable prices; never overwrite existing).
  await prisma.insurancePlan.upsert({ where: { id: "standard" }, update: {}, create: { id: "standard", price: 75, active: true } });
  await prisma.insurancePlan.upsert({ where: { id: "premium" }, update: {}, create: { id: "premium", price: 102, active: true } });

  // 2) Admin account (from env, with a local fallback). Never overwrites an existing one.
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@meridian.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const adminName = process.env.ADMIN_NAME || "Platform Admin";
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    console.warn("⚠  ADMIN_PASSWORD not set — using an insecure default. Set ADMIN_PASSWORD in your environment!");
  }
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail, name: adminName, passwordHash: hash(adminPassword), role: "ADMIN",
      kycStatus: "VERIFIED", idType: "drivers_license", idLast4: "0000", faceCaptured: true, kycVerifiedAt: new Date(),
    },
  });

  // 3) Demo users/accounts — only when explicitly requested (local dev).
  if (process.env.SEED_DEMO === "true") {
    await prisma.user.upsert({
      where: { email: "jonathan@example.com" },
      update: {},
      create: {
        email: "jonathan@example.com", name: "Jonathan A. Reeves", passwordHash: hash("Password123!"), role: "USER",
        kycStatus: "VERIFIED", idType: "drivers_license", idLast4: "9032", faceCaptured: true, kycVerifiedAt: new Date(),
        accounts: {
          create: [
            { type: "traditional", brokerage: "fidelity", label: "Fidelity Traditional IRA", holder: "Jonathan A. Reeves", accountNumber: "X72-4419065", opened: "2019", cashBalance: 15000,
              positions: { create: [{ symbol: "AAPL", shares: 120 }, { symbol: "VOO", shares: 45 }, { symbol: "BND", shares: 200 }] } },
            { type: "roth", brokerage: "schwab", label: "Schwab Roth IRA", holder: "Jonathan A. Reeves", accountNumber: "5538-91402", opened: "2021",
              positions: { create: [{ symbol: "NVDA", shares: 80 }, { symbol: "SCHD", shares: 600 }, { symbol: "QQQ", shares: 30 }] } },
            { type: "rollover", brokerage: "merrill", label: "Merrill Rollover IRA", holder: "Jonathan A. Reeves", accountNumber: "8QC-07731", opened: "2018",
              positions: { create: [{ symbol: "MSFT", shares: 60 }, { symbol: "SPY", shares: 25 }, { symbol: "GLD", shares: 40 }, { symbol: "GOLDBAR", shares: 2 }] } },
          ],
        },
      },
    });

    await prisma.user.upsert({
      where: { email: "maria@example.com" },
      update: {},
      create: {
        email: "maria@example.com", name: "Maria Chen", passwordHash: hash("Password123!"), role: "USER",
        accounts: {
          create: [
            { type: "roth", brokerage: "vanguard", label: "Vanguard Roth IRA", holder: "Maria Chen", accountNumber: "VG-220714", opened: "2020",
              positions: { create: [{ symbol: "VTI", shares: 150 }, { symbol: "AMZN", shares: 40 }, { symbol: "TLT", shares: 90 }] } },
            { type: "sep", brokerage: "etrade", label: "E*TRADE SEP IRA", holder: "Maria Chen", accountNumber: "ET-558031", opened: "2022",
              positions: { create: [{ symbol: "GOOGL", shares: 55 }, { symbol: "JPM", shares: 70 }] } },
          ],
        },
      },
    });
  }

  const counts = {
    stocks: await prisma.stock.count(),
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
  };
  console.log("Seeded:", counts);
  console.log(`Admin login: ${adminEmail}${process.env.ADMIN_PASSWORD ? "" : " / Admin123! (default — change this!)"}`);
  if (process.env.SEED_DEMO === "true") console.log("Demo users: jonathan@example.com & maria@example.com / Password123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
