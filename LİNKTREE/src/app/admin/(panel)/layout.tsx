import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const routes = [
    ["/admin","Overview"],["/admin/content","Content"],["/admin/links","Links"],["/admin/claims","Claims"],
    ["/admin/media","Media"],["/admin/analytics","Analytics"],["/admin/settings","Settings"],["/admin/audit-log","Audit log"],
  ];
  return <div className="admin-body admin-shell">
    <aside className="admin-sidebar"><Link className="brand" href="/admin"><span className="brand-mark">H</span>HeimerClean</Link><nav>{routes.map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}</nav><p style={{ color:"#9ba6bc",fontSize:12 }}>Role: {session.role}</p><form action={logoutAction}><button className="danger-button">Sign out</button></form></aside>
    <main className="admin-main">{children}</main>
  </div>;
}
