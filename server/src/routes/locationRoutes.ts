import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';

const router = Router();
const cache = new Map<string, { at: number; results: unknown[] }>();
let lastRequest = 0;
export const searchPlaces = asyncHandler(async (req, res) => {
  const parsed = z.string().trim().min(3).max(200).safeParse(req.query.q);
  if (!parsed.success) throw createError('Enter a place or address between 3 and 200 characters', 400);
  const q = parsed.data, key = q.toLowerCase(), now = Date.now(), saved = cache.get(key);
  if (saved && now - saved.at < 86400000) { res.json({ results: saved.results }); return; }
  if (now - lastRequest < 1100) { res.setHeader('Retry-After', '2'); throw createError('Please wait two seconds before searching again', 429); }
  lastRequest = now;
  const url = new URL('/search', process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org');
  url.search = new URLSearchParams({ q, format: 'jsonv2', limit: '5', 'accept-language': 'en' }).toString();
  let data: unknown;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'DRECS-College-Demo/1.0 (https://github.com/Het28091/DRECS)' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Search unavailable');
    data = await response.json();
  } catch { throw createError('Place search is unavailable. Select a point on the map or use device location.', 503); }
  const validated = z.array(z.object({ lat: z.string(), lon: z.string(), display_name: z.string().max(2000) })).safeParse(data);
  if (!validated.success) throw createError('Place search returned an invalid response', 503);
  const results = validated.data.slice(0, 5).map(p => ({ latitude: Number(p.lat), longitude: Number(p.lon), address: p.display_name.slice(0, 300) })).filter(p => Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180);
  if (cache.size >= 500) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: now, results });
  res.json({ results });
});
router.get('/search', authenticate, searchPlaces);
export default router;
