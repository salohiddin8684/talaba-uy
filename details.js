// Property details page rendering (API-backed)
const detailsStore = window.TalabaUyStore;
const ui = window.TalabaUyUI;
const configDetails = window.TalabaUyConfig || {
  FALLBACK_IMAGE:
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=70",
};

const getElement = (id) => document.getElementById(id);

const normalizeMapUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  if (/^(www\.)?google\.[a-z.]+\/maps/i.test(raw)) {
    return `https://${raw.replace(/^www\./i, "")}`;
  }
  if (/^(maps\.app\.goo\.gl|maps\.google\.)/i.test(raw)) {
    return `https://${raw}`;
  }
  if (/^geo:/i.test(raw)) {
    return raw;
  }
  return "";
};

const buildMapUrl = (mapValue, fallbackLocation = "", fallbackTitle = "") => {
  const normalized = normalizeMapUrl(mapValue);
  if (normalized) {
    return normalized;
  }
  const query = String(fallbackLocation || fallbackTitle || "").trim();
  if (!query) {
    return "https://www.google.com/maps";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const listingId = new URLSearchParams(window.location.search).get("id");

const showNotFound = (message) => {
  const titleEl = getElement("details-title");
  if (titleEl) {
    titleEl.textContent = message;
  }
};

const init = async () => {
  if (!detailsStore) {
    showNotFound("Listing not found");
    return;
  }

  let listings = [];
  try {
    listings = await detailsStore.getListings();
  } catch (error) {
    showNotFound("Unable to load listing.");
    return;
  }

  let listing = null;
  if (listingId) {
    listing = listings.find((item) => item.id === listingId);
  } else {
    listing = listings[0];
  }

  if (!listing) {
    showNotFound("Listing not found");
    return;
  }

  const details = listing.details || {
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    floor: 0,
    elevator: false,
    parking: false,
    wifi: false,
    cable: false,
    year: "N/A",
  };
  const nearby = listing.nearby || {
    education: [],
    health: [],
    food: [],
    culture: [],
  };

  document.title = `${listing.title} | TalabaUy`;

  const imageEl = getElement("details-image");
  if (imageEl) {
    imageEl.src = listing.image || configDetails.FALLBACK_IMAGE;
    imageEl.alt = listing.title;
  }

  const badgeEl = getElement("details-badge");
  if (badgeEl) {
    badgeEl.classList.toggle("hidden", !listing.featured);
  }

  const titleEl = getElement("details-title");
  if (titleEl) {
    titleEl.textContent = listing.title;
  }

  const locationEl = getElement("details-location");
  if (locationEl) {
    locationEl.textContent = listing.location;
  }

  const priceEl = getElement("details-price");
  if (priceEl && ui) {
    priceEl.textContent = `${ui.formatPrice(listing.price)} / month`;
  }

  const telegramEl = getElement("details-telegram");
  if (telegramEl) {
    const telegramUrl = listing.telegram && listing.telegram.startsWith("http")
      ? listing.telegram
      : `https://t.me/${(listing.telegram || "Erwin002").replace("@", "")}`;
    telegramEl.href = telegramUrl;
  }

  const mapEl = getElement("details-map");
  if (mapEl) {
    mapEl.href = buildMapUrl(listing.map, listing.location, listing.title);
  }

  const tagsEl = getElement("details-tags");
  if (tagsEl) {
    tagsEl.innerHTML = "";
    const tags = [
      `${details.bedrooms} Bedroom${details.bedrooms === 1 ? "" : "s"}`,
      `${details.bathrooms} Bath${details.bathrooms === 1 ? "" : "s"}`,
      `${details.area} m2`,
      details.wifi ? "Wi-Fi" : "No Wi-Fi",
    ];
    tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
  }

  const specGrid = getElement("spec-grid");
  if (specGrid) {
    const specs = [
      { label: "Total Area", value: `${details.area} m2` },
      { label: "Bedrooms", value: details.bedrooms },
      { label: "Bathrooms", value: details.bathrooms },
      { label: "Floor", value: details.floor },
      { label: "Elevator", value: details.elevator ? "Yes" : "No" },
      { label: "Parking", value: details.parking ? "Yes" : "No" },
      { label: "Wi-Fi", value: details.wifi ? "Yes" : "No" },
      { label: "Cable TV", value: details.cable ? "Yes" : "No" },
      { label: "Year Built", value: details.year },
    ];

    specGrid.innerHTML = "";
    specs.forEach((spec) => {
      const card = document.createElement("div");
      card.className = "spec-card";
      card.innerHTML = `
        <span class="spec-label">${spec.label}</span>
        <span class="spec-value">${spec.value}</span>
      `;
      specGrid.appendChild(card);
    });
  }

  const amenitiesGrid = getElement("amenities-grid");
  if (amenitiesGrid) {
    const amenityGroups = [
      { title: "Education", items: nearby.education },
      { title: "Health & Medicine", items: nearby.health },
      { title: "Food", items: nearby.food },
      { title: "Culture", items: nearby.culture },
    ];

    amenitiesGrid.innerHTML = "";
    amenityGroups.forEach((group) => {
      const card = document.createElement("div");
      card.className = "amenity-card";
      const safeItems = group.items.length ? group.items : ["Not specified"];
      const listItems = safeItems
        .map((item) => `<li>${item}</li>`)
        .join("");
      card.innerHTML = `
        <h4>${group.title}</h4>
        <ul>${listItems}</ul>
      `;
      amenitiesGrid.appendChild(card);
    });
  }

  const planImage = getElement("plan-image");
  if (planImage) {
    planImage.src = listing.planImage || configDetails.FALLBACK_IMAGE;
    planImage.alt = `${listing.title} apartment plan`;
  }

  if (detailsStore && ui) {
    const rest = listings.filter((item) => item.id !== listing.id);
    const featured = rest.filter((item) => item.featured).slice(0, 3);
    const district = listing.location.split(",")[0];
    let related = rest.filter((item) => item.location.startsWith(district)).slice(0, 3);

    if (related.length < 3) {
      const fallback = rest.filter((item) => !related.includes(item));
      related = related.concat(fallback).slice(0, 3);
    }

    ui.renderCards(getElement("featured-cards"), featured, null);
    ui.renderCards(getElement("related-cards"), related, null);
  }
};

init();
