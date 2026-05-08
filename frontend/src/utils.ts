import type { TaskFormState } from "./types";

export function normalizeTaskCreateForm(form: TaskFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() ? form.description.trim() : undefined,
    deadline: form.deadline || undefined,
  };
}

export function normalizeTaskUpdateForm(form: TaskFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    deadline: form.deadline || null,
  };
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function isUnauthorizedError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return message.includes("unauthorized") || message.includes("jwt");
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
