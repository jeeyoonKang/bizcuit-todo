import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

import {
  createTask,
  deleteTask,
  fetchTasks,
  login,
  register,
  toggleTaskDone,
  updateTask,
} from "./api";

import { AuthPanel } from "./components/AuthPanel";
import { TaskFormPanel } from "./components/TaskFormPanel";
import { TaskListPanel } from "./components/TaskListPanel";

import type {
  AuthMode,
  AuthResponse,
  Task,
  TaskFilters,
  TaskFormState,
  User,
} from "./types";

import {
  getErrorMessage,
  isUnauthorizedError,
  normalizeTaskCreateForm,
  normalizeTaskUpdateForm,
} from "./utils";

const initialTaskForm: TaskFormState = {
  title: "",
  description: "",
  deadline: "",
};

function App() {
  const [mode, setMode] = useState<AuthMode>("login");

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken"),
  );

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("authUser");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
  });

  const [taskForm, setTaskForm] = useState<TaskFormState>(initialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    sort: "newest",
  });

  const [loading, setLoading] = useState(false);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tasksBusy = loading || submittingTask;

  const clearSession = useCallback((nextError?: string) => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    setTasks([]);
    setTaskForm(initialTaskForm);
    setEditingTaskId(null);
    setError(nextError ?? null);
  }, []);

  const handleTaskError = useCallback(
    (error: unknown) => {
      if (isUnauthorizedError(error)) {
        clearSession("Session expired. Please log in again.");
        return;
      }

      setError(getErrorMessage(error));
    },
    [clearSession],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextTasks = await fetchTasks(token, filters);
        setTasks(nextTasks);
      } catch (err) {
        handleTaskError(err);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, filters, handleTaskError]);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingAuth(true);
    setError(null);

    try {
      const response =
        mode === "login"
          ? await login(authForm.email, authForm.password)
          : await register(authForm.email, authForm.password);

      saveSession(response);
      setToken(response.accessToken);
      setUser(response.user);
      setAuthForm({
        email: "",
        password: "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setSubmittingTask(true);
    setError(null);

    try {
      if (editingTaskId) {
        await updateTask(
          token,
          editingTaskId,
          normalizeTaskUpdateForm(taskForm),
        );
      } else {
        await createTask(token, normalizeTaskCreateForm(taskForm));
      }

      resetTaskForm();
      await reloadTasks(token);
    } catch (err) {
      handleTaskError(err);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleLogout = () => {
    clearSession();
  };

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description ?? "",
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
    });
    setError(null);
  };

  const handleDelete = async (taskId: string) => {
    if (!token) {
      return;
    }

    setError(null);

    try {
      await deleteTask(token, taskId);

      if (editingTaskId === taskId) {
        resetTaskForm();
      }

      await reloadTasks(token);
    } catch (err) {
      handleTaskError(err);
    }
  };

  const handleToggleDone = async (task: Task) => {
    if (!token) {
      return;
    }

    setError(null);

    try {
      await toggleTaskDone(token, task.id, !task.done);
      await reloadTasks(token);
    } catch (err) {
      handleTaskError(err);
    }
  };

  const reloadTasks = async (currentToken: string) => {
    const nextTasks = await fetchTasks(currentToken, filters);
    setTasks(nextTasks);
  };

  const resetTaskForm = () => {
    setTaskForm(initialTaskForm);
    setEditingTaskId(null);
  };

  const saveSession = (response: AuthResponse) => {
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("authUser", JSON.stringify(response.user));
  };

  return (
    <main className="shell">
      <section className="panel intro">
        <p className="eyebrow">Bizcuit code challenge</p>
        <h1>Small frontend, real backend flow.</h1>
        <p className="lede">
          This UI focuses on the core reviewer flows: authenticate, create
          tasks, update status, and verify user-scoped task access.
        </p>
      </section>

      {!token || !user ? (
        <AuthPanel
          mode={mode}
          email={authForm.email}
          password={authForm.password}
          submitting={submittingAuth}
          onModeChange={setMode}
          onEmailChange={(email) =>
            setAuthForm((current) => ({
              ...current,
              email,
            }))
          }
          onPasswordChange={(password) =>
            setAuthForm((current) => ({
              ...current,
              password,
            }))
          }
          onSubmit={handleAuthSubmit}
        />
      ) : (
        <>
          <section className="panel topbar">
            <div>
              <p className="eyebrow">Authenticated as</p>
              <h2>{user.email}</h2>
            </div>

            <button type="button" className="ghost" onClick={handleLogout}>
              Logout
            </button>
          </section>

          <section className="grid">
            <TaskFormPanel
              taskForm={taskForm}
              editing={Boolean(editingTaskId)}
              submitting={submittingTask}
              onFormChange={setTaskForm}
              onSubmit={handleTaskSubmit}
              onCancelEdit={resetTaskForm}
            />

            <TaskListPanel
              tasks={tasks}
              busy={tasksBusy}
              filters={filters}
              loading={loading}
              onFiltersChange={setFilters}
              onToggleDone={handleToggleDone}
              onEdit={handleEdit}
              onDelete={(taskId) => void handleDelete(taskId)}
            />
          </section>
        </>
      )}

      {error ? <p className="error-banner">{error}</p> : null}
    </main>
  );
}

export default App;
