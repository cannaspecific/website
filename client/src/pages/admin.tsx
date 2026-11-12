import { useEffect, useReducer, useRef, useState } from "react";
import {
  adminSessionReducer,
  adminSessionRows,
  initialAdminSession,
  type AdminSessionEvent,
} from "@shared/admin-session-machine";
import { SiteLayout, usePageTitle } from "@/components/site/chrome";

const TOKEN_KEY = "cs_admin_token";

export default function Admin() {
  usePageTitle("Submissions — CannaSpecific");
  const [token, setToken] = useState("");
  const [session, dispatch] = useReducer(adminSessionReducer, initialAdminSession);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const send = (event: AdminSessionEvent) => {
    sessionRef.current = adminSessionReducer(sessionRef.current, event);
    dispatch(event);
  };

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
    return () => {
      meta.remove();
    };
  }, []);

  async function load(nextToken = token) {
    if (adminSessionReducer(sessionRef.current, { type: "load" }) === sessionRef.current) return;
    send({ type: "load" });
    try {
      const response = await fetch("/api/admin/submissions", {
        headers: { "x-admin-token": nextToken },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        send({ type: "loadFailure", message: body?.message || "Could not load submissions." });
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, nextToken);
      send({ type: "loadSuccess", rows: Array.isArray(body?.data) ? body.data : [] });
    } catch {
      send({ type: "loadFailure", message: "Could not reach the server." });
    }
  }

  async function downloadCsv() {
    if (adminSessionReducer(sessionRef.current, { type: "export" }) === sessionRef.current) return;
    send({ type: "export" });
    try {
      const response = await fetch("/api/admin/submissions.csv", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        send({ type: "exportFailure", message: body?.message || "Could not export CSV." });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cannaspecific-submissions.csv";
      link.click();
      URL.revokeObjectURL(url);
      send({ type: "exportSuccess" });
    } catch {
      send({ type: "exportFailure", message: "Could not reach the server." });
    }
  }

  const rows = adminSessionRows(session);
  const busy = session.status === "loading" || session.status === "exporting";

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8" data-admin-state={session.status}>
        <p className="kicker text-[#0f4d3a]">Private</p>
        <h1 className="mt-3 font-heading text-4xl">Submissions</h1>
        <p className="mt-3 max-w-2xl text-[#24312c]">
          This page lists waitlist signups, pilot inquiries, and older interest-form rows. It asks for the admin token set on the server. The token is kept in this browser tab only.
        </p>
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <label className="flex-1 text-sm font-semibold">
            Admin token
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-[#cfc6b6] bg-white px-3 py-3 text-base"
            />
          </label>
          <button
            type="submit"
            disabled={busy || token.trim().length === 0}
            aria-busy={session.status === "loading"}
            className="rounded-full bg-[#0f4d3a] px-5 py-3 text-sm font-semibold text-[#f7f4ec] disabled:opacity-60 sm:self-end"
          >
            {session.status === "loading" ? "Loading…" : "View submissions"}
          </button>
          <button
            type="button"
            disabled={busy || rows === null || token.trim().length === 0}
            aria-busy={session.status === "exporting"}
            onClick={() => void downloadCsv()}
            className="rounded-full border border-[#0f4d3a] px-5 py-3 text-sm font-semibold disabled:opacity-60 sm:self-end"
          >
            {session.status === "exporting" ? "Exporting…" : "Export CSV"}
          </button>
        </form>
        {session.status === "error" && (
          <p role="alert" className="mt-4 text-sm text-[#7a2e24]">{session.message}</p>
        )}
        {session.status === "loading" && rows === null && (
          <p role="status" className="mt-8 text-[#24312c]">Loading submissions…</p>
        )}
        {rows && rows.length === 0 && (
          <p className="mt-8 text-[#24312c]">No submissions yet.</p>
        )}
        {rows && rows.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-xl border border-[#ddd4c4]">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="sr-only">Saved submissions</caption>
              <thead className="bg-[#efeae0] text-xs uppercase tracking-wide text-[#3d4a44]">
                <tr>
                  {["When", "Source", "Kind", "Name", "Email", "Role", "Company", "State", "Email status", "Notify status"].map((heading) => (
                    <th key={heading} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.source}-${row.id}`} className="border-t border-[#eee6d8] align-top">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{row.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td className="px-3 py-3">{row.source === "legacy_interest" ? "Legacy" : "Current"}</td>
                    <td className="px-3 py-3">{row.kind}</td>
                    <td className="px-3 py-3">{row.fullName}</td>
                    <td className="px-3 py-3">{row.email}</td>
                    <td className="px-3 py-3">{row.role}</td>
                    <td className="px-3 py-3">{row.company}</td>
                    <td className="px-3 py-3">{row.state}</td>
                    <td className="px-3 py-3">{row.emailStatus ?? "—"}</td>
                    <td className="px-3 py-3">{row.notifyStatus ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#3d4a44]">
          Legacy rows were saved by the previous form. That form did not notify the owner and did not record whether a confirmation email was delivered.
        </p>
      </div>
    </SiteLayout>
  );
}
