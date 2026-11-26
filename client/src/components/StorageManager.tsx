"use client";
import { useCallback, useEffect, useState } from "react";
import ShelterLocation from "./map/ShelterLocation";
import { getLogistics, postLogistics, Storage } from "@/lib/logistics";
import { fetchShelters } from "@/lib/shelters";
import { Resource, Shelter } from "@/types";
import { Button } from "./ui/Button";

const input =
  "w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm";
export function StorageManager({
  resources,
  onChange,
}: {
  resources: Resource[];
  onChange: () => void;
}) {
  const [stores, setStores] = useState<Storage[]>([]),
    [shelters, setShelters] = useState<Shelter[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [name, setName] = useState(""),
    [address, setAddress] = useState(""),
    [point, setPoint] = useState<[number, number] | null>(null),
    [shelterId, setShelterId] = useState("");
  const [resourceId, setResourceId] = useState(""),
    [storageId, setStorageId] = useState("");
  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([getLogistics(), fetchShelters()]);
      setStores(r.storage);
      setShelters(s);
    } catch {
      setError("Could not load storage locations");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(link: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (link) await postLogistics("storage/link", { resourceId, storageId });
      else {
        const shelter = shelters.find((s) => s.id === shelterId),
          loc = shelter
            ? [shelter.location.latitude, shelter.location.longitude]
            : point;
        if (!loc) throw new Error("Select the storage location");
        await postLogistics("storage", {
          name: shelter ? shelter.name + " storage" : name,
          kind: shelter ? "SHELTER" : "WAREHOUSE",
          shelterId: shelter?.id,
          address: shelter?.location.address || address || shelter?.name,
          latitude: loc[0],
          longitude: loc[1],
        });
        setName("");
        setAddress("");
        setPoint(null);
        setShelterId("");
      }
      await load();
      onChange();
    } catch (e: any) {
      setError(
        Object.values(e.response?.data?.errors || {})
          .flat()
          .join(" ") ||
          e.response?.data?.message ||
          e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="rounded-xl border border-slate-700 p-4">
      <summary className="font-semibold cursor-pointer">
        Storage locations
      </summary>
      <div className="space-y-4 mt-4">
        <p className="text-sm text-slate-400">
          Create a source location once, then select it when adding inventory.
          Shelters reuse their existing location.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
        <form
          className="space-y-3 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            void save(false);
          }}
        >
          <label className="block text-sm">
            Storage type
            <select
              className={input}
              value={shelterId}
              onChange={(e) => setShelterId(e.target.value)}
            >
              <option value="">Warehouse / depot</option>
              {shelters
                .filter((s) => s.status !== "INACTIVE")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          {!shelterId && (
            <>
              <label className="block text-sm">
                Location name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  className={input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <ShelterLocation
                value={point}
                onChange={(p, a) => {
                  setPoint(p);
                  setAddress(a);
                }}
              />
              <label className="block text-sm">
                Address / landmark
                <input
                  required
                  minLength={3}
                  maxLength={300}
                  className={input}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
            </>
          )}
          <Button type="submit" loading={busy}>
            Add storage location
          </Button>
        </form>
        {resources.some((r) => !r.storageId) && (
          <form
            className="space-y-2 border-t border-slate-700 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save(true);
            }}
          >
            <h3 className="font-semibold text-sm">
              Assign a location to older stock
            </h3>
            <label className="block text-sm">
              Item
              <select
                className={input}
                required
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
              >
                <option value="">Select item</option>
                {resources
                  .filter((r) => !r.storageId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.unit})
                    </option>
                  ))}
              </select>
            </label>
            <label className="block text-sm">
              Source
              <select
                className={input}
                required
                value={storageId}
                onChange={(e) => setStorageId(e.target.value)}
              >
                <option value="">Select source</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" loading={busy}>
              Save location
            </Button>
          </form>
        )}
        <ul className="text-sm text-slate-400">
          {stores.map((s) => (
            <li key={s._id}>
              {s.name} · {s.address}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
