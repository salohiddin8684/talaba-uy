const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const { seedListings, FALLBACK_IMAGE } = require("./seed-data");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 5);
const CORS_ORIGIN = process.env.CORS_ORIGIN || true;

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : "";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPG, PNG, or WebP images are allowed."));
  },
});

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/uploads", express.static(uploadDir));
app.use(express.static(path.join(__dirname, "..")));

const parseNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value).toLowerCase();
  return ["true", "on", "1", "yes"].includes(normalized);
};

const parseList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
};

const parseLocationParts = (location) => {
  const parts = String(location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    district: parts[0] || "",
    city: parts.length > 1 ? parts.slice(1).join(", ") : "",
  };
};

const pickString = (value, fallback = "") => {
  const text = String(value || "").trim();
  return text || fallback;
};

const buildImageValue = (file, urlValue, existing) => {
  if (file) {
    return `/uploads/${file.filename}`;
  }
  const url = pickString(urlValue, "");
  if (url) {
    return url;
  }
  if (existing) {
    return existing;
  }
  return FALLBACK_IMAGE;
};

const buildListingPayload = (body, files, existing = null) => {
  const detailsBody = body.details || {};
  const nearbyBody = body.nearby || {};

  const title = pickString(body.title, existing?.title || "");
  const location = pickString(body.location, existing?.location || "");
  const map = pickString(body.map, existing?.map || "");
  const price = parseNumber(body.price, existing?.price || 0);

  const locationParts = parseLocationParts(location);

  const imageFile = files?.image?.[0];
  const planFile = files?.plan?.[0];
  const image = buildImageValue(
    imageFile,
    body["image-url"] || body.imageUrl || "",
    existing?.image
  );
  const planImage = buildImageValue(
    planFile,
    body["plan-url"] || body.planUrl || "",
    existing?.planImage
  );

  const details = {
    area: parseNumber(body.area ?? detailsBody.area, existing?.details?.area || 0),
    bedrooms: parseNumber(body.bedrooms ?? detailsBody.bedrooms, existing?.details?.bedrooms || 1),
    bathrooms: parseNumber(
      body.bathrooms ?? detailsBody.bathrooms,
      existing?.details?.bathrooms || 1
    ),
    floor: parseNumber(body.floor ?? detailsBody.floor, existing?.details?.floor || 0),
    elevator: parseBoolean(body.elevator ?? detailsBody.elevator, false),
    parking: parseBoolean(body.parking ?? detailsBody.parking, false),
    wifi: parseBoolean(body.wifi ?? detailsBody.wifi, false),
    cable: parseBoolean(body.cable ?? detailsBody.cable, false),
    year: parseNumber(body.year ?? detailsBody.year, existing?.details?.year || 0),
  };

  const nearby = {
    education: parseList(
      body["nearby-education"] ?? nearbyBody.education,
      existing?.nearby?.education || []
    ),
    health: parseList(
      body["nearby-health"] ?? nearbyBody.health,
      existing?.nearby?.health || []
    ),
    food: parseList(
      body["nearby-food"] ?? nearbyBody.food,
      existing?.nearby?.food || []
    ),
    culture: parseList(
      body["nearby-culture"] ?? nearbyBody.culture,
      existing?.nearby?.culture || []
    ),
  };

  return {
    title,
    location,
    district: locationParts.district,
    city: locationParts.city,
    map,
    price,
    image,
    planImage,
    telegram: pickString(body.telegram, existing?.telegram || ""),
    featured: parseBoolean(body.featured, false),
    details,
    nearby,
  };
};

const authRequired = (req, res, next) => {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const email = pickString(req.body?.email, "");
  const username = pickString(req.body?.username, "");
  const password = pickString(req.body?.password, "");

  if (!email || !username || !password) {
    res.status(400).json({ error: "Email, username, and password are required." });
    return;
  }

  const admin = await prisma.admin.findFirst({
    where: { email: email.toLowerCase(), username },
  });

  if (!admin) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, username: admin.username },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    admin: { id: admin.id, email: admin.email, username: admin.username },
  });
});

app.get("/api/listings", async (req, res) => {
  const where = {};
  const featured = String(req.query.featured || "");
  const maxPrice = Number(req.query.maxPrice || 0);
  const district = pickString(req.query.district, "");
  const location = pickString(req.query.location, "");

  if (featured === "true") {
    where.featured = true;
  }
  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    where.price = { lte: maxPrice };
  }
  if (district) {
    where.district = { contains: district };
  }
  if (location) {
    where.location = { contains: location };
  }

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
});

app.get("/api/listings/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }
  res.json(listing);
});

app.post(
  "/api/listings",
  authRequired,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "plan", maxCount: 1 },
  ]),
  async (req, res) => {
    const payload = buildListingPayload(req.body, req.files);

    if (!payload.title || !payload.location || !payload.price || payload.price <= 0) {
      res.status(400).json({ error: "Title, location, and price are required." });
      return;
    }

    const listing = await prisma.listing.create({ data: payload });
    res.status(201).json(listing);
  }
);

app.put(
  "/api/listings/:id",
  authRequired,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "plan", maxCount: 1 },
  ]),
  async (req, res) => {
    const existing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Listing not found." });
      return;
    }

    const payload = buildListingPayload(req.body, req.files, existing);
    if (!payload.title || !payload.location || !payload.price || payload.price <= 0) {
      res.status(400).json({ error: "Title, location, and price are required." });
      return;
    }

    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: payload,
    });
    res.json(listing);
  }
);

app.delete("/api/listings/:id", authRequired, async (req, res) => {
  const existing = await prisma.listing.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }
  await prisma.listing.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.post("/api/admin/reset", authRequired, async (req, res) => {
  await prisma.listing.deleteMany();
  await prisma.listing.createMany({ data: seedListings });
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith("Only JPG")) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: `File too large. Max ${MAX_UPLOAD_MB} MB.` });
    return;
  }
  res.status(500).json({ error: "Server error." });
});

app.listen(PORT, () => {
  console.log(`TalabaUy server running on http://localhost:${PORT}`);
});
