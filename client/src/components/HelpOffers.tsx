"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
const input = "w-full rounded-lg border border-slate-600 bg-slate-900 p-2";
export default function HelpOffers() {
  const { user } = useAuth(),
    manager = ["authority", "admin"].includes(user?.role || "");
  const [legacy, setLegacy] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(""),
    [form, setForm] = useState({
      message: "",
      availability: "",
      phoneNumber: "",
    }),
    [search, setSearch] = useState("");
  const lock = useRef(false);
  const load = useCallback(async () => {
    try {
      const r = await api.get(
        manager ? "/volunteer-requests" : "/volunteer-requests/my",
      );
      setOffers(r.data.requests);
      if (!manager) {
        const old = await api.get("/assignments/my");
        setLegacy(old.data.assignments || []);
      }
    } catch {
      setError("Could not load help offers.");
    }
  }, [manager]);
  useEffect(() => {
    if (user) void load();
  }, [load, user]);
  useLiveRefresh(load, !!user);
  async function save(id: string, body: object) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await api.patch("/volunteer-requests/" + id, body);
      setEditing("");
      await load();
    } catch (e) {
      const d = (e as any).response?.data;
      setError(
        Object.values(d?.errors || {})
          .flat()
          .join(" ") ||
          d?.message ||
          "Could not update offer.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">
        {manager ? "Help offers" : "My help offers"}
      </h1>
      <p className="text-slate-400">
        {manager
          ? "Review availability and coordinate with volunteers from each incident."
          : "Manage the availability and contact details shared with management."}
      </p>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <label className="block">
        Search offers
        <input
          className={input}
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {!offers.length && (
        <p>
          No help offers yet.{" "}
          <Link href="/dashboard" className="underline">
            Browse incidents
          </Link>
          .
        </p>
      )}
      {offers
        .filter((o) =>
          `${o.incidentId?.title} ${o.userId?.name} ${o.message}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .map((o) => {
          const closed =
              ["RESOLVED", "CLOSED"].includes(o.incidentStatus) ||
              o.incidentApproval === "REJECTED",
            active = ["PENDING", "APPROVED"].includes(o.status);
          return (
            <article
              key={o.id}
              className="rounded-xl border border-slate-700 p-4 space-y-3"
            >
              <h2 className="font-semibold">
                <Link
                  className="underline"
                  href={"/incidents/" + (o.incidentId?.id || o.incidentId)}
                >
                  {o.incidentId?.title || "Incident"}
                </Link>
              </h2>
              <p>
                {manager ? o.userId?.name + " · " : ""}
                {!active
                  ? "Inactive"
                  : closed
                    ? "Incident resolved / closed"
                    : "Available to help"}
              </p>
              <p>{o.message}</p>
              <p>
                Availability: {o.availability || "Not specified"}
              </p>
              <p>Contact: {o.phoneNumber}</p>
              <p className="text-xs text-slate-400">
                Last shared{" "}
                {new Date(o.updatedAt || o.createdAt).toLocaleString()}. Confirm
                current availability with the person.
              </p>
              {!manager && active && !closed && (
                <>
                  {editing === o.id ? (
                    <form
                      className="space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void save(o.id, form);
                      }}
                    >
                      <label className="block">
                        How you can help
                        <textarea
                          required
                          minLength={10}
                          maxLength={1000}
                          className={input}
                          value={form.message}
                          onChange={(e) =>
                            setForm({ ...form, message: e.target.value })
                          }
                        />
                      </label>
                      <label className="block">
                        Availability
                        <input
                          required
                          minLength={3}
                          maxLength={200}
                          className={input}
                          value={form.availability}
                          onChange={(e) =>
                            setForm({ ...form, availability: e.target.value })
                          }
                        />
                      </label>
                      <label className="block">
                        Mobile number
                        <input
                          type="tel"
                          required
                          maxLength={30}
                          className={input}
                          value={form.phoneNumber}
                          onChange={(e) =>
                            setForm({ ...form, phoneNumber: e.target.value })
                          }
                        />
                      </label>
                      <button
                        disabled={busy}
                        className="rounded bg-orange-600 px-4 py-2"
                      >
                        Save changes
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="ml-3 underline"
                        onClick={() => setEditing("")}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      className="underline mr-4"
                      disabled={busy}
                      onClick={() => {
                        setEditing(o.id);
                        setForm({
                          message: o.message,
                          availability: o.availability || "",
                          phoneNumber: o.phoneNumber,
                        });
                      }}
                    >
                      Update availability / contact
                    </button>
                  )}
                  <button
                    className="underline text-orange-300"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Withdraw this help offer? Its history will be retained.",
                        )
                      )
                        void save(o.id, { status: "WITHDRAWN" });
                    }}
                  >
                    Withdraw offer
                  </button>
                </>
              )}
              <Link
                className="block underline"
                href={"/incidents/" + (o.incidentId?.id || o.incidentId)}
              >
                Open incident and conversation
              </Link>
            </article>
          );
        })}
      {!manager && legacy.length > 0 && (
        <details className="rounded-xl border border-slate-700 p-4">
          <summary className="cursor-pointer">Historical task records</summary>
          <p className="text-sm text-slate-400">
            Previous task records are available for reference.
          </p>
          {legacy.map((a) => (
            <p key={a.id} className="py-2">
              <Link
                className="underline"
                href={"/incidents/" + (a.incidentId?.id || a.incidentId)}
              >
                {a.incidentId?.title || "Incident"}
              </Link>{" "}
              · Recorded status: {a.status}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
