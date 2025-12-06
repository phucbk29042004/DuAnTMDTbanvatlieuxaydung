import api from "./axiosClient.js";

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export async function fetchFavoriteList() {
  if (!isAuthenticated()) {
    return [];
  }

  try {
    const response = await api.get("/api/Product/YeuThich");
    return response.data?.data || [];
  } catch (error) {
    if (error.response?.status === 401) {
      return [];
    }
    throw error;
  }
}

export async function fetchFavoriteIds() {
  const list = await fetchFavoriteList();
  return new Set(
    list
      .map(item => Number(item.IdProduct ?? item.idProduct ?? item.id) || 0)
      .filter(Boolean)
  );
}

export async function toggleFavorite(productId) {
  if (!isAuthenticated()) {
    throw new Error("unauthorized");
  }

  const response = await api.post(`/api/Product/YeuThich/Toggle/${productId}`);
  return {
    isFavorite: !!response.data?.isFavorite,
    message: response.data?.message
  };
}

export async function removeFavorite(productId) {
  if (!isAuthenticated()) {
    throw new Error("unauthorized");
  }
  await api.delete(`/api/Product/YeuThich/${productId}`);
}

