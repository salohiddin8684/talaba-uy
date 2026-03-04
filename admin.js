// TalabaUy admin panel logic (login + CRUD via API)
const adminStore = window.TalabaUyStore;

const loginPanel = document.getElementById("login-panel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const logoutBtn = document.getElementById("logout-btn");

const listingForm = document.getElementById("listing-form");
const listingList = document.getElementById("listing-list");
const formStatus = document.getElementById("form-status");
const resetDataBtn = document.getElementById("reset-data");
const resetFormBtn = document.getElementById("reset-form");
const statsTotal = document.getElementById("stats-total");
const statsFeatured = document.getElementById("stats-featured");

const listingIdInput = document.getElementById("listing-id");
const imageInput = document.getElementById("listing-image");
const imageUrlInput = document.getElementById("listing-image-url");
const planInput = document.getElementById("listing-plan");
const planUrlInput = document.getElementById("listing-plan-url");

let cachedListings = [];

const setStatus = (el, message) => {
  if (el) {
    el.textContent = message;
  }
};

const handleAuthError = (error) => {
  if (error && (error.status === 401 || error.status === 403)) {
    if (adminStore) {
      adminStore.logout();
    }
    showLogin();
    setStatus(loginStatus, "Session expired. Please log in again.");
    return true;
  }
  return false;
};

const showDashboard = async () => {
  if (loginPanel) {
    loginPanel.classList.add("hidden");
  }
  if (dashboard) {
    dashboard.classList.remove("hidden");
  }
  await renderListings();
};

const showLogin = () => {
  if (loginPanel) {
    loginPanel.classList.remove("hidden");
  }
  if (dashboard) {
    dashboard.classList.add("hidden");
  }
};

const updateStats = (listings) => {
  if (!Array.isArray(listings)) {
    return;
  }
  if (statsTotal) {
    statsTotal.textContent = listings.length;
  }
  if (statsFeatured) {
    statsFeatured.textContent = listings.filter((listing) => listing.featured).length;
  }
};

const clearForm = () => {
  if (!listingForm) {
    return;
  }
  listingForm.reset();
  if (listingIdInput) {
    listingIdInput.value = "";
  }
};

const populateForm = (listing) => {
  if (!listingForm || !listing) {
    return;
  }

  const details = listing.details || {};
  const nearby = listing.nearby || {};

  listingIdInput.value = listing.id;
  listingForm.querySelector("#listing-title").value = listing.title || "";
  listingForm.querySelector("#listing-location").value = listing.location || "";
  listingForm.querySelector("#listing-map").value = listing.map || "";
  listingForm.querySelector("#listing-price").value = listing.price || "";
  listingForm.querySelector("#listing-featured").checked = Boolean(listing.featured);
  listingForm.querySelector("#listing-telegram").value = listing.telegram || "";

  listingForm.querySelector("#listing-area").value = details.area ?? "";
  listingForm.querySelector("#listing-bedrooms").value = details.bedrooms ?? "";
  listingForm.querySelector("#listing-bathrooms").value = details.bathrooms ?? "";
  listingForm.querySelector("#listing-floor").value = details.floor ?? "";
  listingForm.querySelector("#listing-year").value = details.year ?? "";

  listingForm.querySelector("#listing-elevator").checked = Boolean(details.elevator);
  listingForm.querySelector("#listing-parking").checked = Boolean(details.parking);
  listingForm.querySelector("#listing-wifi").checked = Boolean(details.wifi);
  listingForm.querySelector("#listing-cable").checked = Boolean(details.cable);

  listingForm.querySelector("#nearby-education").value = (nearby.education || []).join(", ");
  listingForm.querySelector("#nearby-health").value = (nearby.health || []).join(", ");
  listingForm.querySelector("#nearby-food").value = (nearby.food || []).join(", ");
  listingForm.querySelector("#nearby-culture").value = (nearby.culture || []).join(", ");

  if (formStatus) {
    formStatus.textContent = "Editing listing. Update fields and click Save.";
  }
};

const renderListings = async () => {
  if (!adminStore || !listingList) {
    return;
  }
  try {
    const listings = await adminStore.getListings();
    cachedListings = Array.isArray(listings) ? listings : [];
    listingList.innerHTML = "";

    cachedListings.forEach((listing) => {
      const item = document.createElement("div");
      item.className = "listing-item";
      item.dataset.id = listing.id;
      item.innerHTML = `
        <div>
          <h4>${listing.title}</h4>
          <p class="muted">${listing.location} - $${listing.price} / month</p>
        </div>
        <div class="listing-actions">
          <button class="btn btn-outline" type="button" data-action="edit">Edit</button>
          <button class="btn btn-ghost" type="button" data-action="delete">Delete</button>
        </div>
      `;
      listingList.appendChild(item);
    });

    updateStats(cachedListings);
  } catch (error) {
    if (handleAuthError(error)) {
      return;
    }
    setStatus(formStatus, error.message || "Failed to load listings.");
  }
};

if (loginForm) {
  const emailInput = loginForm.querySelector("#login-email");
  const usernameInput = loginForm.querySelector("#login-username");
  const passwordInput = loginForm.querySelector("#login-password");

  loginForm.addEventListener("input", () => {
    setStatus(loginStatus, "");
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!adminStore) {
      return;
    }
    const email = String(emailInput?.value || "").trim();
    const username = String(usernameInput?.value || "").trim();
    const password = String(passwordInput?.value || "").trim();

    if (!email || !username || !password) {
      setStatus(loginStatus, "Please enter email, username, and password.");
      return;
    }

    try {
      await adminStore.login({ email, username, password });
      setStatus(loginStatus, "Login successful.");
      await showDashboard();
    } catch (error) {
      setStatus(loginStatus, error.message || "Login failed.");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (adminStore) {
      adminStore.logout();
    }
    showLogin();
  });
}

if (listingList) {
  listingList.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton) {
      return;
    }
    const action = actionButton.dataset.action;
    const item = actionButton.closest(".listing-item");
    if (!item) {
      return;
    }
    const listingId = item.dataset.id;
    const listing = cachedListings.find((entry) => entry.id === listingId);

    if (action === "edit" && listing) {
      populateForm(listing);
    }

    if (action === "delete" && listing && adminStore) {
      const confirmed = window.confirm("Delete this listing?");
      if (confirmed) {
        try {
          await adminStore.deleteListing(listingId);
          await renderListings();
          setStatus(formStatus, "Listing deleted.");
        } catch (error) {
          if (!handleAuthError(error)) {
            setStatus(formStatus, error.message || "Failed to delete listing.");
          }
        }
      }
    }
  });
}

if (listingForm) {
  listingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!adminStore) {
      return;
    }

    const formData = new FormData(listingForm);
    const editingId = listingIdInput.value;

    const imageFile = imageInput?.files?.[0];
    const planFile = planInput?.files?.[0];
    const title = String(formData.get("title") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const price = Number(formData.get("price") || 0);

    if (!imageFile) {
      formData.delete("image");
    }
    if (!planFile) {
      formData.delete("plan");
    }

    if (!title || !location || !Number.isFinite(price) || price <= 0) {
      setStatus(formStatus, "Please fill in title, location, and price.");
      return;
    }

    if (!imageFile && imageUrlInput && !String(imageUrlInput.value || "").trim()) {
      formData.set("image-url", "");
    }
    if (!planFile && planUrlInput && !String(planUrlInput.value || "").trim()) {
      formData.set("plan-url", "");
    }

    try {
      if (editingId) {
        await adminStore.updateListing(editingId, formData);
        setStatus(formStatus, "Listing updated successfully.");
      } else {
        await adminStore.addListing(formData);
        setStatus(formStatus, "Listing added successfully.");
      }

      clearForm();
      await renderListings();
    } catch (error) {
      if (!handleAuthError(error)) {
        setStatus(formStatus, error.message || "Failed to save listing.");
      }
    }
  });
}

if (resetFormBtn) {
  resetFormBtn.addEventListener("click", () => {
    clearForm();
    setStatus(formStatus, "");
  });
}

if (resetDataBtn) {
  resetDataBtn.addEventListener("click", async () => {
    const confirmed = window.confirm("Reset all listings to the demo data?");
    if (confirmed && adminStore) {
      try {
        await adminStore.resetListings();
        await renderListings();
        setStatus(formStatus, "Demo data restored.");
      } catch (error) {
        if (!handleAuthError(error)) {
          setStatus(formStatus, error.message || "Failed to reset demo data.");
        }
      }
    }
  });
}

if (adminStore && adminStore.isAuthed()) {
  showDashboard();
} else {
  showLogin();
}
