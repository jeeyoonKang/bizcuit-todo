import type { FormEvent } from "react";
import type { TaskFormState } from "../types";

type TaskFormPanelProps = {
  taskForm: TaskFormState;
  editing: boolean;
  submitting: boolean;
  onFormChange: (form: TaskFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
};

export function TaskFormPanel({
  taskForm,
  editing,
  submitting,
  onFormChange,
  onSubmit,
  onCancelEdit,
}: TaskFormPanelProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Task form</p>
          <h2>{editing ? "Edit task" : "Create task"}</h2>
        </div>

        {editing ? (
          <button type="button" className="ghost" onClick={onCancelEdit}>
            Cancel edit
          </button>
        ) : null}
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={taskForm.title}
            onChange={(event) =>
              onFormChange({
                ...taskForm,
                title: event.target.value,
              })
            }
            maxLength={120}
            required
          />
        </label>

        <label>
          <span>Description</span>
          <textarea
            value={taskForm.description}
            onChange={(event) =>
              onFormChange({
                ...taskForm,
                description: event.target.value,
              })
            }
            rows={4}
            maxLength={1000}
            placeholder="Optional"
          />
        </label>

        <label>
          <span>Deadline</span>
          <input
            type="date"
            value={taskForm.deadline}
            onChange={(event) =>
              onFormChange({
                ...taskForm,
                deadline: event.target.value,
              })
            }
          />
        </label>

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Saving..." : editing ? "Update task" : "Create task"}
        </button>
      </form>
    </section>
  );
}
