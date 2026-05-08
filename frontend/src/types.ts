export type User = {
  id: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  done: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthMode = "login" | "register";

export type TaskFilters = {
  status: "all" | "active" | "done" | "overdue";
  sort: "newest" | "deadlineAsc";
};

export type TaskFormState = {
  title: string;
  description: string;
  deadline: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  deadline?: string;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  done?: boolean;
};
