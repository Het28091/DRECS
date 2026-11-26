"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import PrivateCoordination from "./PrivateCoordination";
const MapPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
});
const input = "w-full rounded-lg border border-slate-600 bg-slate-900 p-2";
const button = "rounded-lg bg-orange-600 px-4 py-2 disabled:opacity-50";
const labels: Record<string, string> = {
  REPORTED: "Reported",
  UNDER_REVIEW: "Under review",
  ASSIGNED: "Under review",
  IN_PROGRESS: "Response ongoing",
  RESOLVED: "Resolved",
  CLOSED: "Archived",
};
const refId = (v: any) => (typeof v === "string" ? v : v?.id);
export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>(),
    { user } = useAuth(),
    manager = ["authority", "admin"].includes(user?.role || "");
  const [legacy, setLegacy] = useState<any[]>([]);
  const [incident, setIncident] = useState<any>(null),
    [offers, setOffers] = useState<any[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [person, setPerson] = useState(""),
    [status, setStatus] = useState(""),
    [note, setNote] = useState("");
  const [form, setForm] = useState({
    message: "",
    availability: "",
    phoneNumber: "",
    skills: "",
    experience: "",
  });
  const lock = useRef(false);
  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/incidents/" + id);
      setIncident(data.incident);
      if (manager || ["citizen", "volunteer"].includes(user?.role || "")) {
        const r = await api.get(
          manager
            ? `/incidents/${id}/volunteer-requests`
            : "/volunteer-requests/my",
          { params: manager ? undefined : { incidentId: id } },
        );
        setOffers(r.data.requests);
        const old = await api.get(
          manager ? `/assignments/incident/${id}` : "/assignments/my",
        );
        setLegacy(
          (old.data.assignments || []).filter(
            (a: any) => manager || refId(a.incidentId) === id,
          ),
        );
      }
    } catch (e) {
      setError((e as any).response?.data?.message || "Could not load incident");
    }
  }, [id, manager, user?.role]);
  useEffect(() => {
    if (user) void load();
  }, [load, user]);
  useLiveRefresh(load, !!user);
  async function act(work: () => Promise<any>, message: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await work();
      setNotice(r?.data?.warning || message);
      await load();
    } catch (e) {
      const data = (e as any).response?.data;
      setError(
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
          data?.message ||
          "Could not save. Please retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!incident) return <div role="status">{error || "Loading incident…"}</div>;
  const closed =
    ["RESOLVED", "CLOSED"].includes(incident.status) ||
    incident.approvalStatus === "REJECTED";
  const own = offers.find((o) => ["PENDING", "APPROVED"].includes(o.status));
  const reporter = refId(incident.reportedBy) === user?.id;
  const contacts = [
    {
      id: refId(incident.reportedBy),
      name: incident.reportedBy?.name || "Reporter",
    },
    ...offers.map((o) => ({
      id: refId(o.userId),
      name: o.userId?.name || "Helper",
    })),
    ...legacy.map((a) => ({
      id: refId(a.volunteerId),
      name: a.volunteerId?.name || "Historical participant",
    })),
  ].filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
  const selected = person || contacts[0]?.id;
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/dashboard" className="underline">
        Back to dashboard
      </Link>
      <header>
        <h1 className="text-2xl font-bold">{incident.title}</h1>
        <p className="text-slate-400">
          {labels[incident.status]} ·{" "}
          {incident.approvalStatus === "APPROVED"
            ? "Publicly verified"
            : incident.approvalStatus === "PENDING"
              ? "Awaiting public verification"
              : "Rejected report"}{" "}
          · {incident.severity}
        </p>
      </header>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-emerald-300">
          {notice}
        </p>
      )}
      <p className="whitespace-pre-wrap">{incident.description}</p>
      <p>{incident.location.address}</p>
      <details>
        <summary className="cursor-pointer">View reported location</summary>
        <MapPicker
          value={[incident.location.latitude, incident.location.longitude]}
          onChange={() => {}}
          readOnly
        />
      </details>
      {manager && (
        <section className="rounded-xl border border-slate-700 p-4 space-y-3">
          <h2 className="font-semibold">Management response</h2>
          {incident.approvalStatus === "PENDING" && (
            <div className="flex gap-2">
              <button
                disabled={busy}
                className={button}
                onClick={() =>
                  void act(
                    () =>
                      api.patch(`/incidents/${id}/review`, {
                        status: "APPROVED",
                      }),
                    "Report published",
                  )
                }
              >
                Verify for public visibility
              </button>
              <button
                disabled={busy}
                className={button}
                onClick={() =>
                  void act(
                    () =>
                      api.patch(`/incidents/${id}/review`, {
                        status: "REJECTED",
                      }),
                    "Report rejected",
                  )
                }
              >
                Reject report
              </button>
            </div>
          )}
          <p className="text-sm text-slate-400">
            Update the status based on the current situation. Review outstanding inventory reservations separately.
          </p>
          {incident.allowedTransitions?.length > 0 && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void act(
                  () => api.patch(`/incidents/${id}/status`, { status, note }),
                  "Response updated",
                );
              }}
            >
              <label className="block">
                Response status
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={input}
                >
                  <option value="">Choose a change</option>
                  {incident.allowedTransitions.map((s: string) => (
                    <option key={s} value={s}>
                      {s === "IN_PROGRESS" && closed
                        ? "Reopen response"
                        : labels[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Reason / response update
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={input}
                />
              </label>
              <button
                disabled={busy || !incident.allowedTransitions.includes(status)}
                className={button}
              >
                Save response decision
              </button>
            </form>
          )}
          <Link href="/resources" className="underline">
            Review inventory allocations
          </Link>
        </section>
      )}
      {manager && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">People offering help</h2>
          {!offers.length && (
            <p>
              No help offers received.
            </p>
          )}
          {offers.map((o) => (
            <article
              key={o.id}
              className="rounded-xl border border-slate-700 p-4"
            >
              <p className="font-semibold">
                {o.userId?.name || "Helper"} ·{" "}
                {closed
                  ? "Incident resolved / unavailable"
                  : ["PENDING", "APPROVED"].includes(o.status)
                    ? "Available"
                    : "Withdrawn / historical"}
              </p>
              <p>{o.message}</p>
              <p>
                Availability:{" "}
                {o.availability || "Not specified"}
              </p>
              <p>Contact: {o.phoneNumber}</p>
              <p className="text-sm text-slate-400">
                Skills: {o.skills.join(", ") || "Not specified"}
              </p>
              <button
                className="underline"
                onClick={() => setPerson(refId(o.userId))}
              >
                Open private conversation
              </button>
            </article>
          ))}
        </section>
      )}
      {!manager && !closed && incident.approvalStatus === "APPROVED" && (
        <section className="rounded-xl border border-slate-700 p-4 space-y-3">
          <h2 className="font-semibold">
            {own ? "Your help offer" : "Offer help"}
          </h2>
          <p className="text-sm text-slate-400">
            Coordinate with management and follow official safety instructions.
          </p>
          {own ? (
            <>
              <p>{own.message}</p>
              <p>{own.availability}</p>
              <Link href="/volunteers/tasks" className="underline">
                Update availability or withdraw
              </Link>
            </>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void act(
                  () =>
                    api.post(`/incidents/${id}/volunteer-request`, {
                      ...form,
                      skills: form.skills
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    }),
                  "Your offer is now visible to management",
                );
              }}
            >
              <label className="block">
                How can you help?
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
                  placeholder="Today, 3–6 pm"
                  className={input}
                  value={form.availability}
                  onChange={(e) =>
                    setForm({ ...form, availability: e.target.value })
                  }
                />
              </label>
              <label className="block">
                Indian mobile number
                <input
                  required
                  maxLength={30}
                  type="tel"
                  className={input}
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                />
              </label>
              <label className="block">
                Skills (optional, comma separated)
                <input
                  maxLength={800}
                  className={input}
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </label>
              <button disabled={busy} className={button}>
                Share help offer
              </button>
            </form>
          )}
        </section>
      )}
      {(manager || reporter || offers.length > 0 || legacy.length > 0) && (
        <>
          {manager && (
            <label className="block">
              Private conversation with
              <select
                className={input}
                value={selected}
                onChange={(e) => setPerson(e.target.value)}
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <PrivateCoordination
            key={manager ? selected : user?.id}
            incidentId={id}
            personId={manager ? selected : undefined}
          />
        </>
      )}
      {manager && legacy.length > 0 && (
        <details>
          <summary>Historical task records</summary>
          {legacy.map((a) => (
            <p key={a.id}>
              {a.volunteerId?.name || "Historical participant"} · {a.status}
            </p>
          ))}
        </details>
      )}
      <section className="space-y-2">
        <h2 className="font-semibold">Response history</h2>
        {incident.statusHistory.map((h: any, i: number) => (
          <p key={i} className="text-sm">
            <span className="text-slate-400">
              {new Date(h.changedAt).toLocaleString()} ·{" "}
              {labels[h.status] || h.status}
            </span>
            <br />
            {h.note}
          </p>
        ))}
      </section>
    </div>
  );
}
