import type {
  AuthResponse,
  CreateTaskPayload,
  Task,
  TaskFilters,
  UpdateTaskPayload,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await safeJson(response)) as
      | { message?: string | string[] }
      | undefined;

    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `Request failed with status ${response.status}`);

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function register(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchTasks(token: string, filters: TaskFilters) {
  const search = new URLSearchParams({
    status: filters.status,
    sort: filters.sort,
  });

  return request<Task[]>(`/tasks?${search.toString()}`, undefined, token);
}

export function createTask(token: string, payload: CreateTaskPayload) {
  return request<Task>(
    "/tasks",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateTask(
  token: string,
  taskId: string,
  payload: UpdateTaskPayload,
) {
  return request<Task>(
    `/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function toggleTaskDone(token: string, taskId: string, done: boolean) {
  return request<Task>(
    done ? `/tasks/${taskId}/done` : `/tasks/${taskId}/undone`,
    {
      method: "PATCH",
    },
    token,
  );
}

export function deleteTask(token: string, taskId: string) {
  return request<{ success: true }>(
    `/tasks/${taskId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
