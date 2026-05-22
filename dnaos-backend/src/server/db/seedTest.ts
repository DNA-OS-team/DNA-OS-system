import "dotenv/config";
import { getPrisma } from "./prisma.js";
import { hashPassword } from "../../core/auth/password.js";

const SEED_IDS = {
  coreCompany: "seed-company-core-001",
  customerCompany: "seed-company-cust-001",
  supplierCompany: "seed-company-supp-001",
  customerSite: "seed-site-001",
  category1: "seed-cat-cement-001",
  category2: "seed-cat-rebar-001",
  product1: "seed-product-cement-001",
  product2: "seed-product-rebar-001",
  variant1: "seed-variant-cement-50kg",
  variant2: "seed-variant-rebar-12mm",
  submission: "seed-submission-001",
  project: "seed-project-001",
};

async function main() {
  const prisma = getPrisma();
  console.log("🌱 Seeding test data to Supabase...\n");

  // 1. Admin
  const passwordHash = await hashPassword("iamadmin");
  const admin = await prisma.admin.upsert({
    where: { username: "dnaos" },
    update: { passwordHash, status: "ACTIVE" },
    create: {
      singletonKey: 1,
      username: "dnaos",
      email: "admin@dnaos.local",
      name: "DNA OS Admin",
      phoneNumber: null,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Admin: ${admin.username} (${admin.role})`);

  // 2. CORE company
  const coreCompany = await prisma.company.upsert({
    where: { id: SEED_IDS.coreCompany },
    update: {},
    create: {
      id: SEED_IDS.coreCompany,
      name: "DNA OS Construction Co., Ltd.",
      type: "CORE",
      status: "ACTIVE",
      taxId: "0000000000001",
      phone: "02-000-0001",
      email: "core@dnaos.co.th",
      address: "123 DNA Tower, Bangkok",
    },
  });
  console.log(`✅ CORE: ${coreCompany.name}`);

  // 3. Customer company
  const customerCompany = await prisma.company.upsert({
    where: { id: SEED_IDS.customerCompany },
    update: {},
    create: {
      id: SEED_IDS.customerCompany,
      name: "ABC Construction Co., Ltd.",
      type: "CUSTOMER",
      status: "ACTIVE",
      taxId: "1234567890123",
      phone: "02-111-2233",
      email: "contact@abc-construction.co.th",
      address: "456 Construction Road, Bangkok",
    },
  });
  console.log(`✅ Customer: ${customerCompany.name}`);

  // 4. Customer site
  const customerSite = await prisma.customerSite.upsert({
    where: { id: SEED_IDS.customerSite },
    update: {},
    create: {
      id: SEED_IDS.customerSite,
      customerCompanyId: customerCompany.id,
      siteName: "Bangkapi Condo Project",
      address: "789 Bangkapi, Bangkok 10240",
      province: "Bangkok",
      district: "Bangkapi",
      subdistrict: "Khlong Chan",
      postalCode: "10240",
      contactName: "คุณสมชาย ใจดี",
      contactPhone: "081-234-5678",
    },
  });
  console.log(`✅ Site: ${customerSite.siteName}`);

  // 5. Credit profile
  await prisma.customerCreditProfile.upsert({
    where: { customerCompanyId: customerCompany.id },
    update: {},
    create: {
      customerCompanyId: customerCompany.id,
      creditLimit: 5000000,
      creditStatus: "NORMAL",
      paymentBehaviorScore: 85,
      creditTermDays: 30,
    },
  });
  console.log(`✅ Credit: limit 5,000,000 THB / 30 วัน`);

  // 6. Supplier company
  const supplierCompany = await prisma.company.upsert({
    where: { id: SEED_IDS.supplierCompany },
    update: {},
    create: {
      id: SEED_IDS.supplierCompany,
      name: "Siam Materials Co., Ltd.",
      type: "SUPPLIER",
      status: "ACTIVE",
      taxId: "9876543210987",
      phone: "02-555-6677",
      email: "sales@siammaterials.co.th",
      address: "321 Supplier Park, Samut Prakan",
    },
  });
  console.log(`✅ Supplier: ${supplierCompany.name}`);

  // 7. Product categories
  const category1 = await prisma.productCategory.upsert({
    where: { id: SEED_IDS.category1 },
    update: {},
    create: {
      id: SEED_IDS.category1,
      name: "ปูนซีเมนต์",
      description: "ปูนซีเมนต์และวัสดุก่อสร้างพื้นฐาน",
      sortOrder: 1,
    },
  });

  const category2 = await prisma.productCategory.upsert({
    where: { id: SEED_IDS.category2 },
    update: {},
    create: {
      id: SEED_IDS.category2,
      name: "เหล็ก",
      description: "เหล็กเส้นและเหล็กโครงสร้าง",
      sortOrder: 2,
    },
  });
  console.log(`✅ Categories: ${category1.name}, ${category2.name}`);

  // 8. Products
  const product1 = await prisma.product.upsert({
    where: { id: SEED_IDS.product1 },
    update: {},
    create: {
      id: SEED_IDS.product1,
      categoryId: category1.id,
      name: "ปูนซีเมนต์ปอร์ตแลนด์",
      description: "ปูนซีเมนต์ปอร์ตแลนด์ประเภท 1 มาตรฐาน มอก.",
      defaultUnit: "ถุง",
      isActive: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { id: SEED_IDS.product2 },
    update: {},
    create: {
      id: SEED_IDS.product2,
      categoryId: category2.id,
      name: "เหล็กเส้นกลม",
      description: "เหล็กเส้นกลม SR24 มาตรฐาน มอก. 20-2559",
      defaultUnit: "เส้น",
      isActive: true,
    },
  });
  console.log(`✅ Products: ${product1.name}, ${product2.name}`);

  // 9. Product variants
  const variant1 = await prisma.productVariant.upsert({
    where: { id: SEED_IDS.variant1 },
    update: {},
    create: {
      id: SEED_IDS.variant1,
      productId: product1.id,
      name: "50 กก.",
      unit: "ถุง",
      specs: { weight_kg: 50, grade: "Type1" },
      isActive: true,
    },
  });

  const variant2 = await prisma.productVariant.upsert({
    where: { id: SEED_IDS.variant2 },
    update: {},
    create: {
      id: SEED_IDS.variant2,
      productId: product2.id,
      name: "12 มม. x 10 ม.",
      unit: "เส้น",
      specs: { diameter_mm: 12, length_m: 10, grade: "SR24" },
      isActive: true,
    },
  });
  console.log(`✅ Variants: ${variant1.name}, ${variant2.name}`);

  // 10. Partner product submission
  const submission = await prisma.partnerProductSubmission.upsert({
    where: { id: SEED_IDS.submission },
    update: {},
    create: {
      id: SEED_IDS.submission,
      supplierCompanyId: supplierCompany.id,
      productVariantId: variant1.id,
      requestedProductName: "ปูนซีเมนต์ปอร์ตแลนด์ 50 กก.",
      requestedCategoryName: "ปูนซีเมนต์",
      unit: "ถุง",
      price: 185.00,
      stockQty: 10000,
      minQty: 100,
      serviceArea: "กรุงเทพฯ และปริมณฑล",
      description: "ปูนซีเมนต์คุณภาพสูง ส่งตรงจากโรงงาน",
      status: "APPROVED",
      adminReviewNote: "ผ่านการตรวจสอบ คุณภาพมาตรฐาน",
      reviewedAt: new Date(),
    },
  });
  console.log(`✅ Submission: ${submission.requestedProductName} (${submission.status})`);

  // 11. Project
  const project = await prisma.project.upsert({
    where: { id: SEED_IDS.project },
    update: {},
    create: {
      id: SEED_IDS.project,
      projectNo: "PRJ-TEST-001",
      customerCompanyId: customerCompany.id,
      customerSiteId: customerSite.id,
      title: "โครงการก่อสร้าง Bangkapi Condo Phase 1",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Project: ${project.projectNo} — ${project.title}`);

  // Summary counts
  console.log("\n📊 Database totals:");
  const [companies, sites, categories, products, variants, submissions, projects, admins] =
    await Promise.all([
      prisma.company.count(),
      prisma.customerSite.count(),
      prisma.productCategory.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.partnerProductSubmission.count(),
      prisma.project.count(),
      prisma.admin.count(),
    ]);

  console.log(`  companies: ${companies}`);
  console.log(`  customer sites: ${sites}`);
  console.log(`  categories: ${categories}`);
  console.log(`  products: ${products}`);
  console.log(`  variants: ${variants}`);
  console.log(`  submissions: ${submissions}`);
  console.log(`  projects: ${projects}`);
  console.log(`  admins: ${admins}`);

  console.log("\n🎉 Supabase ใช้งานได้แล้ว!");
  console.log("   Login: username=dnaos  password=iamadmin");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
