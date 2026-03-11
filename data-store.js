/*
  TalabaUy API-backed data store
  This replaces localStorage with real backend requests.
*/
(() => {
  const API_BASE = window.TalabaUyApiBase || "";
  const TOKEN_KEY = "talabauy_admin_token_v1";
  const DEFAULT_TELEGRAM = "https://t.me/Erwin002";
  const FALLBACK_IMAGE = "./assets/placeholder.svg";

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
  const setToken = (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const request = async (path, options = {}) => {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, options);
    } catch (error) {
      throw new Error("Unable to reach the backend server.");
    }
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const message = data?.error || data?.message || `Request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return data;
  };

  const send = (path, method, data, { auth = false } = {}) => {
    const headers = {};
    if (auth) {
      const token = getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const options = { method, headers };
    if (data !== null && data !== undefined) {
      if (data instanceof FormData) {
        options.body = data;
      } else {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(data);
      }
    }

    return request(path, options);
  };

  const login = async (credentials) => {
    const result = await send("/api/auth/login", "POST", credentials);
    if (result?.token) {
      setToken(result.token);
    }
    return result;
  };

  const logout = () => setToken("");
  const isAuthed = () => Boolean(getToken());

  const getListings = () => request("/api/listings");
  const getListingById = (id) =>
    request(`/api/listings/${encodeURIComponent(id)}`);
  const addListing = (payload) =>
    send("/api/listings", "POST", payload, { auth: true });
  const updateListing = (id, payload) =>
    send(`/api/listings/${encodeURIComponent(id)}`, "PUT", payload, {
      auth: true,
    });
  const deleteListing = (id) =>
    send(`/api/listings/${encodeURIComponent(id)}`, "DELETE", null, {
      auth: true,
    });
  const resetListings = () =>
    send("/api/admin/reset", "POST", null, { auth: true });

  window.TalabaUyConfig = {
    DEFAULT_TELEGRAM,
    FALLBACK_IMAGE,
  };

  window.TalabaUyStore = {
    getToken,
    isAuthed,
    login,
    logout,
    getListings,
    getListingById,
    addListing,
    updateListing,
    deleteListing,
    resetListings,
  };
})();
