// TalabaUy global interactions (navigation + listings)
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const themeToggle = document.querySelector(".theme-toggle");
const themeRoot = document.documentElement;
const THEME_KEY = "talabauy_theme";

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close the menu after tapping a link on mobile
  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

const normalizeTheme = (value) => (value === "light" || value === "dark" ? value : "");

const getPreferredTheme = () => {
  const storedTheme = normalizeTheme(localStorage.getItem(THEME_KEY));
  if (storedTheme) {
    return storedTheme;
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const applyTheme = (theme) => {
  themeRoot.setAttribute("data-theme", theme);
  if (themeToggle) {
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
};

applyTheme(getPreferredTheme());

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = themeRoot.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

const store = window.TalabaUyStore;
const config = window.TalabaUyConfig || {
  DEFAULT_TELEGRAM: "https://t.me/Erwin002",
  FALLBACK_IMAGE: "",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const buildTelegramUrl = (value) => {
  if (!value) {
    return config.DEFAULT_TELEGRAM;
  }
  if (value.startsWith("http")) {
    return value;
  }
  return `https://t.me/${value.replace("@", "")}`;
};

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

const createListingCard = (listing) => {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.price = listing.price;

  const image = listing.image || config.FALLBACK_IMAGE;
  const telegramUrl = buildTelegramUrl(listing.telegram);
  const mapUrl = buildMapUrl(listing.map, listing.location, listing.title);

  card.innerHTML = `
    <a class="card-media" href="index.html?id=${listing.id}#details" aria-label="View details for ${listing.title}">
      <img src="${image}" alt="${listing.title}">
      ${listing.featured ? '<span class="badge">Featured</span>' : ""}
    </a>
    <div class="card-body">
      <h3>${listing.title}</h3>
      <p class="card-meta">${listing.location}</p>
      <div class="card-price">${formatPrice(listing.price)} / month</div>
      <div class="card-actions">
        <a class="btn btn-outline" href="${telegramUrl}" target="_blank" rel="noopener">Telegram</a>
        <a class="btn btn-ghost" href="${mapUrl}" target="_blank" rel="noopener">Map</a>
        <a class="btn btn-ghost" href="index.html?id=${listing.id}#details">View Details</a>
      </div>
    </div>
  `;

  return card;
};

const renderCards = (container, listings, emptyState) => {
  if (!container) {
    return;
  }
  container.innerHTML = "";

  if (!listings.length) {
    if (emptyState) {
      emptyState.textContent = "No listings match your filters yet.";
    }
    return;
  }

  if (emptyState) {
    emptyState.textContent = "";
  }

  listings.forEach((listing) => container.appendChild(createListingCard(listing)));
};

window.TalabaUyUI = {
  renderCards,
  createListingCard,
  formatPrice,
};

const cardsContainer = document.getElementById("cards");
const emptyState = document.getElementById("empty-state");
const filterForm = document.getElementById("price-filter");
const maxPriceInput = document.getElementById("max-price");
const districtInput = document.getElementById("district");
const locationInput = document.getElementById("location");
const filterHint = document.getElementById("filter-hint");

let allListings = [];

const refreshListings = async () => {
  if (!store || !cardsContainer) {
    return;
  }
  try {
    allListings = await store.getListings();
    renderCards(cardsContainer, allListings, emptyState);
  } catch (error) {
    allListings = [];
    if (emptyState) {
      emptyState.textContent = "Unable to load listings. Start the backend server.";
    }
  }
};

if (cardsContainer && store) {
  refreshListings();
}

const normalizeFilterValue = (value) => value.trim().toLowerCase();

const getListingLocationParts = (listing) => {
  const rawLocation = String(listing.location || "").trim();
  const parts = rawLocation
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const district = String(listing.district || parts[0] || "").trim();
  const city = String(listing.city || (parts.length > 1 ? parts.slice(1).join(", ") : "")).trim();
  return {
    rawLocation,
    district,
    city,
  };
};

const resetFilters = () => {
  renderCards(cardsContainer, allListings, emptyState);
  if (filterHint) {
    filterHint.textContent = "Tip: Try 200, Yunusabad, or Tashkent to narrow results.";
  }
};

const applyFilters = () => {
  const priceValue = maxPriceInput ? maxPriceInput.value.trim() : "";
  const districtValue = districtInput ? districtInput.value.trim() : "";
  const locationValue = locationInput ? locationInput.value.trim() : "";

  if (!priceValue && !districtValue && !locationValue) {
    resetFilters();
    return;
  }

  let maxPrice = null;
  if (priceValue) {
    maxPrice = Number(priceValue);
    if (Number.isNaN(maxPrice) || maxPrice <= 0) {
      if (filterHint) {
        filterHint.textContent = "Enter a valid number greater than 0.";
      }
      if (maxPriceInput) {
        maxPriceInput.focus();
      }
      renderCards(cardsContainer, allListings, emptyState);
      return;
    }
  }

  const districtNeedle = normalizeFilterValue(districtValue);
  const locationNeedle = normalizeFilterValue(locationValue);

  const filtered = allListings.filter((listing) => {
    const { rawLocation, district, city } = getListingLocationParts(listing);
    const priceMatch = maxPrice === null || listing.price <= maxPrice;
    const districtMatch = !districtNeedle || district.toLowerCase().includes(districtNeedle);
    const locationSource = city || rawLocation;
    const locationMatch = !locationNeedle || locationSource.toLowerCase().includes(locationNeedle);
    return priceMatch && districtMatch && locationMatch;
  });

  renderCards(cardsContainer, filtered, emptyState);

  if (filterHint) {
    const filterSummary = [];
    if (maxPrice !== null) {
      filterSummary.push(`under ${formatPrice(maxPrice)}`);
    }
    if (districtValue) {
      filterSummary.push(`district: ${districtValue}`);
    }
    if (locationValue) {
      filterSummary.push(`location: ${locationValue}`);
    }
    const summaryText = filterSummary.length ? ` for ${filterSummary.join(", ")}` : "";
    filterHint.textContent = filtered.length
      ? `Showing ${filtered.length} option${filtered.length === 1 ? "" : "s"}${summaryText}.`
      : "No listings match those filters.";
  }
};

if (filterForm && filterHint && store) {
  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
  });

  [maxPriceInput, districtInput, locationInput].forEach((input) => {
    if (!input) {
      return;
    }
    input.addEventListener("input", () => {
      const hasValue =
        (maxPriceInput && maxPriceInput.value.trim()) ||
        (districtInput && districtInput.value.trim()) ||
        (locationInput && locationInput.value.trim());
      if (!hasValue) {
        resetFilters();
      }
    });
  });
}

// Listings are now loaded from the backend API.

