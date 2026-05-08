import { startTransition } from "react";
import type { Task, TaskFilters } from "../types";
import { formatDate, isTaskOverdue } from "../utils";

type TaskListPanelProps = {
  tasks: Task[];
  filters: TaskFilters;
  busy: boolean;
  loading: boolean;
  onFiltersChange: (filters: TaskFilters) => void;
  onToggleDone: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
};

export function TaskListPanel({
  tasks,
  filters,
  busy,
  loading,
  onFiltersChange,
  onToggleDone,
  onEdit,
  onDelete,
}: TaskListPanelProps) {
  const taskCountLabel =
    tasks.length === 1 ? "1 task in view" : `${tasks.length} tasks in view`;
  const emptyStateMessage =
    filters.status === "all"
      ? "No tasks yet. Create one from the form to start the review flow."
      : "No tasks match the current filter.";

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Task list</p>
          <h2>{taskCountLabel}</h2>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          {(["all", "active", "done", "overdue"] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={filters.status === status ? "chip active" : "chip"}
              onClick={() =>
                startTransition(() => {
                  onFiltersChange({
                    ...filters,
                    status,
                  });
                })
              }
              disabled={busy}
            >
              {status}
            </button>
          ))}
        </div>

        <label className="sort-select">
          <span>Sort</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              startTransition(() => {
                onFiltersChange({
                  ...filters,
                  sort: event.target.value as TaskFilters["sort"],
                });
              })
            }
            disabled={busy}
          >
            <option value="newest">Newest</option>
            <option value="deadlineAsc">Deadline asc</option>
          </select>
        </label>
      </div>

      {loading ? <p className="status-message">Loading tasks...</p> : null}

      {!loading && tasks.length === 0 ? (
        <p className="status-message">{emptyStateMessage}</p>
      ) : null}

      <div className="task-list">
        {tasks.map((task) => {
          const isOverdue =
            !task.done && task.deadline ? isTaskOverdue(task.deadline) : false;

          return (
            <article
              key={task.id}
              className={isOverdue ? "task-card overdue" : "task-card"}
            >
              <div className="task-copy">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className={task.done ? "badge done" : "badge active"}>
                    {task.done ? "Done" : isOverdue ? "Overdue" : "Active"}
                  </span>
                </div>

                {task.description ? <p>{task.description}</p> : null}

                <dl className="meta">
                  <div>
                    <dt>Deadline</dt>
                    <dd>
                      {task.deadline ? formatDate(task.deadline) : "None"}
                    </dd>
                  </div>

                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(task.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="task-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => onToggleDone(task)}
                  disabled={busy}
                >
                  {task.done ? "Mark active" : "Mark done"}
                </button>

                <button
                  type="button"
                  className="ghost"
                  onClick={() => onEdit(task)}
                  disabled={busy}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => onDelete(task.id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
