const DEFAULT_TELEGRAM = "https://t.me/Erwin002";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=70";

const withLocationParts = (listing) => {
  const parts = String(listing.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    ...listing,
    district: listing.district || parts[0] || "",
    city: listing.city || (parts.length > 1 ? parts.slice(1).join(", ") : ""),
  };
};

const rawSeedListings = [
  withLocationParts({
    id: "tal-001",
    title: "Sunny Shared Room",
    location: "Yunusabad, Tashkent",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70",
    planImage:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=70",
    telegram: DEFAULT_TELEGRAM,
    featured: true,
    map: "",
    details: {
      area: 24,
      bedrooms: 2,
      bathrooms: 1,
      floor: 3,
      elevator: true,
      parking: true,
      wifi: true,
      cable: false,
      year: 2018,
    },
    nearby: {
      education: ["Tashkent State University", "Study Hub"],
      health: ["City Clinic", "24/7 Pharmacy"],
      food: ["Campus Cafe", "Green Market"],
      culture: ["Youth Center", "Cinema City"],
    },
  }),
  withLocationParts({
    id: "tal-002",
    title: "Cozy Attic Room",
    location: "Mirzo-Ulugbek, Tashkent",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=70",
    planImage:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=70",
    telegram: DEFAULT_TELEGRAM,
    featured: false,
    map: "",
    details: {
      area: 30,
      bedrooms: 1,
      bathrooms: 1,
      floor: 4,
      elevator: false,
      parking: false,
      wifi: true,
      cable: true,
      year: 2014,
    },
    nearby: {
      education: ["IT Park Learning Center", "University Library"],
      health: ["Family Clinic", "Wellness Lab"],
      food: ["Metro Food Court", "Bakery #5"],
      culture: ["City Museum", "Art Space"],
    },
  }),
  withLocationParts({
    id: "tal-003",
    title: "Quiet Twin Dorm",
    location: "Chilonzor, Tashkent",
    price: 150,
    image:
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=70",
    planImage:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70",
    telegram: DEFAULT_TELEGRAM,
    featured: true,
    map: "",
    details: {
      area: 26,
      bedrooms: 2,
      bathrooms: 1,
      floor: 2,
      elevator: true,
      parking: true,
      wifi: true,
      cable: false,
      year: 2020,
    },
    nearby: {
      education: ["Medical College", "Campus Co-Working"],
      health: ["District Hospital", "Dental Clinic"],
      food: ["Student Canteen", "Coffee House"],
      culture: ["Open Air Park", "Sports Arena"],
    },
  }),
  withLocationParts({
    id: "tal-004",
    title: "Riverside Private Room",
    location: "Yakkasaroy, Tashkent",
    price: 210,
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70",
    planImage:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=70",
    telegram: DEFAULT_TELEGRAM,
    featured: false,
    map: "",
    details: {
      area: 32,
      bedrooms: 1,
      bathrooms: 1,
      floor: 6,
      elevator: true,
      parking: true,
      wifi: true,
      cable: true,
      year: 2021,
    },
    nearby: {
      education: ["Business School", "Language Center"],
      health: ["Private Clinic", "Fitness Recovery Lab"],
      food: ["Riverside Grill", "Local Market"],
      culture: ["History Museum", "City Theater"],
    },
  }),
  withLocationParts({
    id: "tal-005",
    title: "Studio Near Metro",
    location: "Shaykhontohur, Tashkent",
    price: 240,
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=70",
    planImage:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70",
    telegram: DEFAULT_TELEGRAM,
    featured: true,
    map: "",
    details: {
      area: 38,
      bedrooms: 1,
      bathrooms: 1,
      floor: 9,
      elevator: true,
      parking: false,
      wifi: true,
      cable: true,
      year: 2019,
    },
    nearby: {
      education: ["Design Institute", "Metro Study Hall"],
      health: ["Central Clinic", "Pharmacy Plus"],
      food: ["Metro Food Hall", "Noodle Bar"],
      culture: ["Culture Park", "Open Library"],
    },
  }),
  withLocationParts({
    id: "tal-006",
    title: "Modern 3-Room Flat",
    location: "Sergeli, Tashkent",
    price: 300,
    image:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=70",
    planImage:
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=70",
    telegram: DEFAULT_TELEGRAM,
    featured: false,
    map: "",
    details: {
      area: 56,
      bedrooms: 3,
      bathrooms: 2,
      floor: 5,
      elevator: true,
      parking: true,
      wifi: true,
      cable: true,
      year: 2016,
    },
    nearby: {
      education: ["Engineering College", "Innovation Hub"],
      health: ["City Hospital", "Vision Clinic"],
      food: ["Food Street", "Local Bakery"],
      culture: ["Sports Complex", "Community Center"],
    },
  }),
];

const seedListings = rawSeedListings.map((listing) => ({
  ...listing,
  details: JSON.stringify(listing.details || {}),
  nearby: JSON.stringify(listing.nearby || {}),
}));

module.exports = {
  DEFAULT_TELEGRAM,
  FALLBACK_IMAGE,
  seedListings,
};
