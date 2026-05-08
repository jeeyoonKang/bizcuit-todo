import type { TaskFormState } from "./types";

const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

function getDateParts(value: string) {
  const match = DATE_PREFIX_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    dateKey: `${match[1]}-${match[2]}-${match[3]}`,
  };
}

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
  const parts = getDateParts(value);

  if (parts) {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
  }

  return new Date(value).toLocaleDateString();
}

export function isTaskOverdue(deadline: string) {
  const parts = getDateParts(deadline);

  if (parts) {
    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    return parts.dateKey < todayKey;
  }

  return new Date(deadline) < new Date();
}
