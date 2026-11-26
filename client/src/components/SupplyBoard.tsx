"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Modal } from "./ui/Modal";
import {
  getLogistics,
  getSuggestions,
  postLogistics,
  changeTransfer,
  LogisticsData,
  Suggestions,
} from "@/lib/logistics";
import { getAllResources } from "@/lib/resources";
import { fetchShelters } from "@/lib/shelters";
import { Resource, Shelter } from "@/types";
import { RESOURCE_CATEGORIES } from "@/lib/constants";
const input =
  "w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm";
const empty: LogisticsData = {
  storage: [],
  needs: [],
  transfers: [],
  stock: [],
  ledger: [],
};
type Action = {
  title: string;
  detail: string;
  path?: string;
  body?: Record<string, unknown>;
  transferId?: string;
  status?: string;
  max: number;
  quantity: number;
  requestKey: string;
  notes?: boolean;
  send?: boolean;
};
export default function SupplyBoard() {
  const { user, isLoading } = useAuth();
  const allowed = user?.role === "admin" || user?.role === "authority";
  const [data, setData] = useState(empty),
    [resources, setResources] = useState<Resource[]>([]),
    [shelters, setShelters] = useState<Shelter[]>([]);
  const [shelterId, setShelterId] = useState(""),
    [tab, setTab] = useState("Needed"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null),
    [action, setAction] = useState<Action | null>(null),
    [quantity, setQuantity] = useState(1),
    [notes, setNotes] = useState(""),
    [sendNow, setSendNow] = useState(true);
  const [need, setNeed] = useState({
    item: "",
    category: "Water",
    unit: "bottles",
    requested: 10,
    urgency: "NORMAL",
    notes: "",
  });
  const needRetry = useRef({ body: "", key: "" });
  const lock = useRef(false);
  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      const [d, r, s] = await Promise.all([
        getLogistics(shelterId || undefined),
        getAllResources(),
        fetchShelters(),
      ]);
      setData(d);
      setResources(r.resources);
      setShelters(s);
      setShelterId((current) => current || s[0]?.id || "");
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load supplies");
    } finally {
      setLoading(false);
    }
  }, [allowed, shelterId]);
  useEffect(() => {
    void load();
  }, [load]);
  useLiveRefresh(load, allowed && !busy);
  async function act(work: () => Promise<unknown>, text: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      setAction(null);
      setSuggestions(null);
      setNotice(text);
      await load();
    } catch (e: any) {
      setError(
        Object.values(e.response?.data?.errors || {})
          .flat()
          .join(" ") ||
          e.response?.data?.message ||
          "Action was not confirmed. Retry safely.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function saveNeed() {
    const body = JSON.stringify({ ...need, shelterId });
    if (body !== needRetry.current.body)
      needRetry.current = { body, key: crypto.randomUUID() };
    await postLogistics("needs", {
      ...need,
      shelterId,
      requestKey: needRetry.current.key,
    });
    needRetry.current = { body: "", key: "" };
  }
  function confirm(a: Omit<Action, "requestKey">) {
    setAction({ ...a, requestKey: crypto.randomUUID() });
    setQuantity(a.quantity);
    setNotes("");
    setSendNow(true);
    setError("");
  }
  async function commit() {
    if (!action) return;
    await act(
      () =>
        action.transferId
          ? changeTransfer(action.transferId, action.status!, {
              ...(["RECEIVED", "RETURNED", "DAMAGED"].includes(action.status!)
                ? { quantity, requestKey: action.requestKey }
                : {}),
              ...(action.notes ? { notes } : {}),
            })
          : postLogistics(action.path!, {
              ...action.body,
              quantity,
              requestKey: action.requestKey,
              ...(action.notes ? { notes } : {}),
              ...(action.send ? { sendNow } : {}),
            }),
      "Supply records updated.",
    );
  }
  if (isLoading || (allowed && loading)) return <p>Loading supplies…</p>;
  if (!allowed)
    return <p>Supply management is available to the management team.</p>;
  const resource = (id: string) => resources.find((r) => r.id === id);
  const item = (id: string) => {
    const r = resource(id);
    return r ? `${r.name} (${r.unit})` : "Inventory item";
  };
  const needs = data.needs.filter((n) => n.shelterId === shelterId),
    transfers = data.transfers.filter(
      (t) =>
        t.shelterId === shelterId &&
        ["RESERVED", "DISPATCHED"].includes(t.status),
    ),
    stock = data.stock.filter((s) => s.shelterId === shelterId);
  const selected = shelters.find((s) => s.id === shelterId);
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Shelter supplies</h1>
        <p className="text-sm text-slate-400 mt-1">
          Choose a shelter, record what it needs, and track deliveries. Manage
          source stock in{" "}
          <Link className="underline text-amber-300" href="/resources">
            Inventory
          </Link>
          .
        </p>
      </header>
      {error && !action && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-emerald-300">
          {notice}
        </p>
      )}
      <label className="block text-sm max-w-xl">
        Shelter
        <select
          className={input}
          value={shelterId}
          onChange={(e) => {
            setShelterId(e.target.value);
            setSuggestions(null);
          }}
        >
          <option value="">Choose a shelter</option>
          {shelters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.status === "INACTIVE" ? " (inactive)" : ""}
            </option>
          ))}
        </select>
      </label>
      {!shelters.length && (
        <Card>
          Create a shelter first in{" "}
          <Link href="/shelters" className="underline">
            Shelters
          </Link>
          .
        </Card>
      )}
      {selected && (
        <>
          <p className="text-sm text-slate-400">
            {selected.location.address} · {selected.currentOccupancy}/
            {selected.capacity} people · Updated{" "}
            {new Date(selected.updatedAt || "").toLocaleString()}
          </p>
          <nav className="flex flex-wrap gap-2" aria-label="Supply sections">
            {["Needed", "On the way", "Available here"].map((t) => (
              <Button
                key={t}
                variant={t === tab ? "primary" : "outline"}
                onClick={() => setTab(t)}
              >
                {t}
              </Button>
            ))}
          </nav>
          {tab === "Needed" && (
            <>
              <Card>
                <details>
                  <summary className="font-semibold cursor-pointer">
                    Record additional supplies needed
                  </summary>
                  <p className="text-xs text-slate-400 my-3">
                    Check stock already at this shelter and existing requests
                    first. This creates an additional request, not a target
                    stock level.
                  </p>
                  <form
                    className="grid sm:grid-cols-2 gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act(() => saveNeed(), "Shelter need recorded.");
                    }}
                  >
                    <label className="sm:col-span-2 text-sm">
                      Choose an inventory item (fills category and unit)
                      <select
                        className={input}
                        defaultValue=""
                        onChange={(e) => {
                          const r = resource(e.target.value);
                          if (r)
                            setNeed({
                              ...need,
                              item: r.name,
                              category: r.category,
                              unit: r.unit,
                            });
                        }}
                      >
                        <option value="">
                          Choose an item, or enter one below
                        </option>
                        {resources
                          .filter(
                            (r) =>
                              ![
                                "Vehicle/Transport",
                                "Equipment",
                                "Personnel",
                              ].includes(r.category),
                          )
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} · {r.unit}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      Item
                      <input
                        className={input}
                        required
                        minLength={2}
                        maxLength={120}
                        value={need.item}
                        onChange={(e) =>
                          setNeed({ ...need, item: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Category
                      <select
                        className={input}
                        value={need.category}
                        onChange={(e) =>
                          setNeed({ ...need, category: e.target.value })
                        }
                      >
                        {RESOURCE_CATEGORIES.filter(
                          (c) =>
                            ![
                              "Vehicle/Transport",
                              "Equipment",
                              "Personnel",
                            ].includes(c),
                        ).map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      Unit
                      <input
                        className={input}
                        required
                        maxLength={40}
                        value={need.unit}
                        onChange={(e) =>
                          setNeed({ ...need, unit: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Quantity
                      <input
                        className={input}
                        type="number"
                        required
                        min={1}
                        max={1000000000}
                        step={1}
                        value={need.requested || ""}
                        onChange={(e) =>
                          setNeed({
                            ...need,
                            requested: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      Urgency
                      <select
                        className={input}
                        value={need.urgency}
                        onChange={(e) =>
                          setNeed({ ...need, urgency: e.target.value })
                        }
                      >
                        {["NORMAL", "HIGH", "CRITICAL"].map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      Notes (optional)
                      <input
                        className={input}
                        maxLength={500}
                        value={need.notes}
                        onChange={(e) =>
                          setNeed({ ...need, notes: e.target.value })
                        }
                      />
                    </label>
                    <Button
                      type="submit"
                      loading={busy}
                      disabled={selected.status === "INACTIVE"}
                    >
                      Save need
                    </Button>
                  </form>
                </details>
              </Card>
              {!needs.length && (
                <Card>No supply requests for this shelter yet.</Card>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {needs.map((n) => (
                  <Card key={n._id} className="space-y-3">
                    <h2 className="font-semibold">
                      {n.item} · {n.urgency.toLowerCase()}
                    </h2>
                    <p className="text-sm">
                      Requested {n.requested} · Received {n.fulfilled} ·
                      Prepared / on the way {n.committed} {n.unit}
                    </p>
                    <p className="text-amber-300">
                      Still needed: {n.shortage} {n.unit}
                    </p>
                    <Button
                      disabled={
                        busy ||
                        n.shortage === 0 ||
                        selected.status === "INACTIVE"
                      }
                      onClick={async () => {
                        if (lock.current) return;
                        lock.current = true;
                        setBusy(true);
                        setError("");
                        try {
                          setSuggestions(await getSuggestions(n._id));
                        } catch {
                          setError("Could not find stock. Please retry.");
                        } finally {
                          lock.current = false;
                          setBusy(false);
                        }
                      }}
                    >
                      Find stock / send supplies
                    </Button>
                  </Card>
                ))}
              </div>
              {suggestions && (
                <Card className="space-y-3">
                  <h2 className="font-semibold">
                    Sources for {suggestions.need.item}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {suggestions.distanceNote}
                  </p>
                  {!suggestions.suggestions.length && (
                    <p>
                      No matching stock with a source location. Add or link
                      inventory first.
                    </p>
                  )}
                  {suggestions.suggestions.map((s) => (
                    <div
                      key={s.resourceId}
                      className="border-t border-slate-700 pt-3 flex flex-wrap justify-between gap-3"
                    >
                      <div>
                        <p>{s.storageName}</p>
                        <p className="text-xs text-slate-400">
                          {s.address} · {s.distanceKm} km · {s.available}{" "}
                          {s.unit} available
                        </p>
                      </div>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          confirm({
                            title: "Send supplies",
                            detail: `${s.name} (${s.unit}) from ${s.storageName} to ${selected.name}.`,
                            path: "transfers",
                            body: {
                              needId: suggestions.need._id,
                              resourceId: s.resourceId,
                            },
                            max: Math.min(s.available, suggestions.shortage),
                            quantity: Math.min(
                              s.suggestedQuantity || suggestions.shortage,
                              s.available,
                            ),
                            send: true,
                          })
                        }
                      >
                        Choose source
                      </Button>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}
          {tab === "On the way" && (
            <div className="space-y-3">
              {!transfers.length && (
                <Card>
                  No outstanding deliveries. Start from Needed to send supplies;
                  completed movements appear in History.
                </Card>
              )}
              {transfers.map((t) => {
                const remaining =
                  t.quantity -
                  (t.receivedQuantity || 0) -
                  (t.returnedQuantity || 0) -
                  (t.damagedQuantity || 0);
                return (
                  <Card key={t._id} className="space-y-3">
                    <h2 className="font-semibold">
                      {item(t.resourceId)} · {t.quantity}
                    </h2>
                    <p className="text-sm">
                      {
                        {
                          RESERVED: "Prepared",
                          DISPATCHED: "On the way",
                          RECEIVED: "Received",
                          CANCELLED: "Cancelled",
                          SETTLED: "Delivery accounted for",
                        }[t.status]
                      }{" "}
                      · {new Date(t.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      Received{" "}
                      {t.receivedQuantity ||
                        (t.status === "RECEIVED" ? t.quantity : 0)}{" "}
                      · Returned {t.returnedQuantity || 0} · Damaged/lost{" "}
                      {t.damagedQuantity || 0}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(t.status === "RESERVED"
                        ? ["DISPATCHED", "CANCELLED"]
                        : t.status === "DISPATCHED"
                          ? ["RECEIVED", "RETURNED", "DAMAGED"]
                          : []
                      ).map((status) => (
                        <Button
                          key={status}
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            confirm({
                              title: {
                                DISPATCHED: "Confirm dispatch",
                                CANCELLED: "Cancel preparation",
                                RECEIVED: "Confirm receipt",
                                RETURNED: "Confirm return to source",
                                DAMAGED: "Record damaged or lost goods",
                              }[status]!,
                              detail:
                                status === "RETURNED"
                                  ? "Confirm goods are physically back at their source before restoring inventory."
                                  : status === "RECEIVED"
                                    ? "Record only goods physically received at the shelter. Partial receipts are supported."
                                    : "This creates an auditable stock movement.",
                              transferId: t._id,
                              status,
                              max: remaining,
                              quantity: remaining,
                              notes: ["RETURNED", "DAMAGED"].includes(status),
                            })
                          }
                        >
                          {
                            {
                              DISPATCHED: "Dispatch",
                              CANCELLED: "Cancel",
                              RECEIVED: "Receive",
                              RETURNED: "Return to source",
                              DAMAGED: "Damage / loss",
                            }[status]
                          }
                        </Button>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {tab === "Available here" && (
            <div className="grid md:grid-cols-2 gap-3">
              {!stock.length && <Card>No received stock yet.</Card>}
              {stock.map((s) => (
                <Card key={s._id} className="space-y-3">
                  <h2 className="font-semibold">{item(s.resourceId)}</h2>
                  <p>
                    Available here: {s.quantity} · Used: {s.consumed}
                  </p>
                  <Button
                    disabled={busy || !s.quantity}
                    onClick={() =>
                      confirm({
                        title: "Record usage",
                        detail:
                          "Record supplies distributed or consumed. Usage does not automatically create new demand.",
                        path: "consume",
                        body: { stockId: s._id },
                        max: s.quantity,
                        quantity: 1,
                        notes: true,
                      })
                    }
                  >
                    Record usage
                  </Button>
                </Card>
              ))}
            </div>
          )}
          <details className="rounded-xl border border-slate-700 p-3">
            <summary className="cursor-pointer">Movement history</summary>
            <Card>
              <h2 className="font-semibold mb-3">Recent movements</h2>
              <p className="text-xs text-slate-400 mb-3">
                Latest 100 movements for this shelter.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="p-2">When</th>
                      <th className="p-2">Item</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Quantity</th>
                      <th className="p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ledger
                      .filter((l) => l.shelterId === shelterId)
                      .map((l) => (
                        <tr key={l._id} className="border-t border-slate-700">
                          <td className="p-2">
                            {new Date(l.createdAt).toLocaleString()}
                          </td>
                          <td className="p-2">{item(l.resourceId)}</td>
                          <td className="p-2">{l.action.toLowerCase()}</td>
                          <td className="p-2">{l.quantity}</td>
                          <td className="p-2">{l.notes || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </details>
        </>
      )}
      <Modal
        isOpen={!!action}
        onClose={() => setAction(null)}
        title={action?.title}
        busy={busy}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void commit();
          }}
        >
          <p className="text-sm text-slate-300">{action?.detail}</p>
          {error && (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          )}
          <label className="block text-sm">
            Quantity
            <input
              className={input}
              type="number"
              min={1}
              max={action?.max}
              step={1}
              required
              disabled={
                !!action?.transferId &&
                ["DISPATCHED", "CANCELLED"].includes(action.status || "")
              }
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          {action?.send && (
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendNow}
                onChange={(e) => setSendNow(e.target.checked)}
              />
              Goods are leaving now (uncheck to prepare for later)
            </label>
          )}
          {action?.notes && (
            <label className="block text-sm">
              Reason / notes
              <textarea
                required
                minLength={3}
                maxLength={500}
                className={input}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          )}
          <Button type="submit" loading={busy}>
            Confirm
          </Button>
        </form>
      </Modal>
    </div>
  );
}
