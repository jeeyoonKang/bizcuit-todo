import type { FormEvent } from "react";
import type { AuthMode } from "../types";

type AuthPanelProps = {
  mode: AuthMode;
  email: string;
  password: string;
  submitting: boolean;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthPanel({
  mode,
  email,
  password,
  submitting,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthPanelProps) {
  return (
    <section className="panel auth-panel">
      <div className="mode-switch" role="tablist" aria-label="Auth mode">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => onModeChange("login")}
        >
          Login
        </button>

        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => onModeChange("register")}
        >
          Register
        </button>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
          />
        </label>

        <button type="submit" className="primary" disabled={submitting}>
          {submitting
            ? "Submitting..."
            : mode === "login"
              ? "Login"
              : "Create account"}
        </button>
      </form>
    </section>
  );
}
