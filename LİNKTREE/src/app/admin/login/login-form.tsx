"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: null });
  return <form action={action} className="form-stack">
    {state.error ? <p className="error" role="alert">{state.error}</p> : null}
    <label>Email<input name="email" type="email" autoComplete="username" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={10} /></label>
    <button className="button primary" disabled={pending}>{pending ? "Signing in…" : "Sign in securely"}</button>
  </form>;
}
