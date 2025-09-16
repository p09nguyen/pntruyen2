import axios from "axios";

const API_BASE_URL = "https://pntruyen.online/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Story {
  show_on_home?: number; // Hiển thị trên trang chủ
  latest_chapter_update?: string; // add for all-stories
  total_views?: number;
  id: number;
  title: string;
  slug: string;
  author: string;
  cover_image?: string;
  description?: string;
  status: "ongoing" | "completed" | "paused";
  category_id: number;
  category_name?: string;
  category_slug?: string;
  chapter_count?: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  story_id: number;
  title: string;
  slug: string;
  content: string;
  chapter_number: number;
  story_title?: string;
  story_slug?: string;
  prev_chapter_id?: number;
  prev_chapter_slug?: string;
  next_chapter_id?: number;
  next_chapter_slug?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  chapter_id: number;
  user_id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  // Admin only fields (for comment management)
  chapter_title?: string;
  chapter_slug?: string;
  story_id?: number;
  story_title?: string;
  story_slug?: string;
}

export interface User {
  full_name?: string;
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  avatar_url?: string;
}

export interface NotificationGroup {
  story_id: number;
  story_title: string;
  story_slug?: string; // optional: backend may provide for slug routing
  unread_count: number;
  chapters: {
    id: number;
    chapter_title: string;
    chapter_number: number;
    created_at: string;
    is_read: number;
    slug?: string; // optional chapter slug for pretty URL
  }[];
  latest_created_at: string;
}

export interface Bookmark {
  id: number;
  user_id: number;
  story_id: number;
  chapter_id?: number;
  story_title: string;
  author: string;
  cover_image?: string;
  chapter_title?: string;
  chapter_number?: number;
  created_at: string;
}

// API functions
export const categoriesApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<{ success: boolean; data: Category[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/categories.php?page=${page}&limit=${limit}`),
  create: (data: { name: string }) => api.post("/categories.php", data),
  delete: (id: number) => api.delete(`/categories.php?id=${id}`),
};

export const storiesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    status?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.category_id)
      searchParams.append("category_id", params.category_id.toString());
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);

    return api.get(`/stories.php?${searchParams.toString()}`);
  },
  getById: (id: number) => api.get(`/stories.php?id=${id}`),
  getBySlug: (slug: string) => api.get(`/stories.php?slug=${slug}`),
  create: (data: Partial<Story>) => api.post("/stories.php", data),
  update: (id: number, data: Partial<Story>) =>
    api.post(`/stories.php?id=${id}`, { ...data, _method: "PUT" }),
  delete: (id: number) => api.delete(`/stories.php?id=${id}`),
};

export const chaptersApi = {
  getByStoryId: (
    storyId: number,
    page: number = 1,
    limit: number = 20,
    opts?: { admin?: 0 | 1; sort?: 'asc' | 'desc' }
  ) => {
    const params = new URLSearchParams();
    params.append('story_id', String(storyId));
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (opts?.admin === 1) params.append('admin', '1');
    if (opts?.sort) params.append('sort', opts.sort);
    return api.get(`/chapters.php?${params.toString()}`);
  },
  getById: (id: number) => api.get(`/chapters.php?id=${id}`),
  getBySlug: (storySlug: string, chapterSlug: string) =>
    api.get(`/chapters.php?story_slug=${storySlug}&slug=${chapterSlug}`),
  create: (data: Partial<Chapter>) => api.post("/chapters.php", data),
  update: (id: number, data: Partial<Chapter>) =>
    api.post(`/chapters.php?id=${id}`, { ...data, _method: "PUT" }),
  delete: (id: number) => api.delete(`/chapters.php?id=${id}`),
};

export const authApi = {
  googleLogin: (code: string) =>
    api.post<{ success: boolean; user?: User }>(
      '/auth.php?action=google',
      { code }
    ),
  register: (data: { username: string; email: string; password: string; full_name: string }) =>
    api.post<{ success: boolean; message: string; user_id?: number }>(
      "/auth.php?action=register",
      data,
    ),

  login: (data: { username: string; password: string }) =>
    api.post<{ success: boolean; message: string; user?: User }>(
      "/auth.php?action=login",
      data,
    ),

  logout: () =>
    api.post<{ success: boolean; message: string }>("/auth.php?action=logout"),
  getCurrentUser: () => api.get<{ success: boolean; user?: User }>("/auth.php"),
};

export const popularStoriesApi = {
  getAll(limit: number = 10) {
    return api.get(`/popular-stories.php?limit=${limit}`);
  },
};

export const allStoriesApi = {
  getAll() {
    return api.get("/all-stories.php").then((res) => res.data.data);
  },
};

export const featuredStoriesApi = {
  getAll() {
    return api.get("/featured-stories.php");
  },
  add(story_id: number, large_image?: string) {
    return api.post("/featured-stories.php", { story_id, large_image });
  },
  remove(featured_id: number) {
    return api.delete(`/featured-stories.php?id=${featured_id}`);
  },
  move(featured_id: number, direction: "up" | "down") {
    return api.post("/featured-stories.php", {
      id: featured_id,
      action: "move",
      direction,
    });
  },
};

export const usersApi = {
  getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    return api.get("/users.php", { params });
  },
  create(data: {
    username: string;
    email: string;
    password: string;
    role: string;
    status?: string;
  }) {
    return api.post("/users.php", data);
  },
  update(
    id: number,
    data: Partial<{
      username: string;
      email: string;
      role: string;
      status: string;
    }>,
  ) {
    return api.put(`/users.php?id=${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/users.php?id=${id}`);
  },
};

export const notificationsApi = {
  getAll: (unreadOnly = false) => api.get<{ success: boolean; data: NotificationGroup[] }>(`/notifications.php${unreadOnly ? '?unread=1' : ''}`),
  markRead: (id: number) => api.post('/notifications.php', { id }),
  markAllRead: () => api.post('/notifications.php', { all: true }),
  delete: (id: number) => api.delete(`/notifications.php?id=${id}`),
};

export const bookmarksApi = {
  getAll: () =>
    api.get<{ success: boolean; data: Bookmark[] }>("/bookmarks.php"),
  create: (data: { story_id: number; chapter_id?: number }) =>
    api.post("/bookmarks.php", data),
  delete: (storyId: number) => api.delete(`/bookmarks.php?story_id=${storyId}`),
};

export const commentsApi = {
  getByChapterId: (chapterId: number) => api.get<{comments: Comment[]}>(`/comments.php?chapter_id=${chapterId}`),
  getByUserId: (userId: number) => api.get<{data: Comment[]}>(`/comments.php?user_id=${userId}`),
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<{comments: Comment[], pagination: {page: number, limit: number, total: number, pages: number}}>(
      `/comments.php?all=1${params?.page ? `&page=${params.page}` : ''}${params?.limit ? `&limit=${params.limit}` : ''}`
    ),
  create: (data: {chapter_id: number; user_id: number; content: string}) => api.post('/comments.php', data),
  delete: (id: number) => api.delete(`/comments.php?id=${id}`),
};

export default api;
