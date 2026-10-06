export const normalizeItem = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
export const shortage = (need: { requested: number; fulfilled: number; committed: number }) => Math.max(0, need.requested - need.fulfilled - need.committed);
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const radians = (n: number) => n * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude), dLng = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h))) * 10) / 10;
}
export function matchesNeed(resource: { name: string; category: string; unit: string }, need: { item: string; category: string; unit: string }) {
  return normalizeItem(resource.name) === normalizeItem(need.item) && resource.category === need.category && normalizeItem(resource.unit) === normalizeItem(need.unit);
}
export function assertTransferAction(current: string, next: string) {
  if (current === next) return;
  if (!((current === 'RESERVED' && ['DISPATCHED', 'CANCELLED'].includes(next)) || (current === 'DISPATCHED' && next === 'RECEIVED'))) throw new Error('Invalid transfer transition');
}
