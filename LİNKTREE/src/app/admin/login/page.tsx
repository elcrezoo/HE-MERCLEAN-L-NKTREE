import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return <main className="admin-body admin-login"><section className="login-card">
    <div className="brand"><span className="brand-mark">H</span>HeimerClean</div>
    <h1>Signal Hub admin</h1>
    <p style={{ color: "#9ba6bc" }}>Private, owner-managed publishing workspace.</p>
    <LoginForm />
  </section></main>;
}
