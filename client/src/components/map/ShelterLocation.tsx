"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
const MapPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <p>Loading map…</p>,
});
type Place = { latitude: number; longitude: number; address: string };
export default function ShelterLocation({
  value,
  onChange,
}: {
  value: [number, number] | null;
  onChange: (point: [number, number], address: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<Place[]>([]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const revision = useRef(0),
    lock = useRef(false);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  const select = (point: [number, number], address = "") => {
    revision.current++;
    onChange(point, address);
    setResults([]);
    setNotice("Location selected. Check the pin before saving.");
  };
  async function search() {
    if (lock.current) return;
    if (query.trim().length < 3) {
      setNotice("Enter at least 3 characters to search.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setNotice("");
    setResults([]);
    const current = ++revision.current;
    try {
      const { data } = await api.get("/locations/search", {
        params: { q: query.trim() },
        timeout: 12000,
      });
      if (revision.current === current) {
        setResults(data.results);
        if (!data.results.length)
          setNotice(
            "No places found. Try a nearby landmark or select the map.",
          );
      }
    } catch (e) {
      if (revision.current === current)
        setNotice(
          (e as { response?: { data?: { message?: string } } }).response?.data
            ?.message || "Search unavailable. Use the map or device location.",
        );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function locate() {
    if (lock.current) return;
    if (!navigator.geolocation) {
      setNotice("Device location is unavailable. Search or select the map.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setNotice("Detecting your location…");
    const current = ++revision.current;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (current === revision.current) {
          select([p.coords.latitude, p.coords.longitude]);
          setNotice(
            `Device location selected (accuracy about ${Math.round(p.coords.accuracy)} metres). Adjust the pin if needed.`,
          );
        }
        lock.current = false;
        setBusy(false);
      },
      () => {
        if (current === revision.current)
          setNotice(
            "Location permission was denied or detection failed. Search or select the map.",
          );
        lock.current = false;
        setBusy(false);
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true },
    );
  }
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold mb-2">Location *</legend>
      <label className="block text-sm" htmlFor="shelter-place-search">
        Search place or address
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="shelter-place-search"
          maxLength={200}
          className="flex-1 min-w-0 rounded-lg border border-slate-600 bg-slate-900 p-2"
          value={query}
          onChange={(e) => {
            revision.current++;
            setQuery(e.target.value);
            setResults([]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
          placeholder="Town, street or landmark"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void search()}
          className="rounded-lg border border-slate-600 p-2 disabled:opacity-50"
        >
          Search
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={locate}
          className="rounded-lg border border-slate-600 p-2 disabled:opacity-50"
        >
          Use my location
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Place search by OpenStreetMap.
      </p>
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left rounded-lg border border-slate-600 p-2"
                onClick={() => select([p.latitude, p.longitude], p.address)}
              >
                {p.address}
              </button>
            </li>
          ))}
        </ul>
      )}
      <MapPicker value={value} onChange={(p) => select(p)} />
      <p role="status" className="text-sm text-slate-300">
        {notice}
      </p>
    </fieldset>
  );
}
