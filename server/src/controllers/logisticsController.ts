import mongoose, { ClientSession, Types } from 'mongoose';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { Resource } from '../models/Resource';
import { Shelter } from '../models/Shelter';
import { StorageLocation, ShelterNeed, SupplyTransfer, ShelterStock, StockMovement } from '../models/Logistics';
import { shortage, distanceKm, matchesNeed, assertTransferAction } from '../utils/logisticsPolicy';

export async function transaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try { return (await session.withTransaction(() => work(session))) as T; }
  finally { await session.endSession(); }
}
async function activeShelter(id: unknown, session: ClientSession) {
  const shelter = await Shelter.findOneAndUpdate({ _id: id, status: { $ne: 'INACTIVE' } }, { $set: { logisticsLinked: true }, $inc: { __v: 1 } }, { new: true, session });
  if (!shelter) throw createError('Select an active shelter', 400);
  return shelter;
}
const checkId = (id: string) => { if (!Types.ObjectId.isValid(id)) throw createError('Invalid record ID', 400); };

export const getLogistics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [storage, needs, transfers, stock, ledger] = await Promise.all([
    StorageLocation.find().sort({ name: 1 }).lean(), ShelterNeed.find().sort({ createdAt: -1 }).lean(),
    SupplyTransfer.find().sort({ createdAt: -1 }).lean(), ShelterStock.find().lean(), StockMovement.find().sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  res.json({ storage, needs: needs.map(n => ({ ...n, shortage: shortage(n) })), transfers, stock, ledger });
});
export const createStorage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await transaction(async session => {
    let data = req.body;
    if (data.kind === 'SHELTER') {
      const shelter = await activeShelter(data.shelterId, session);
      data = { ...data, latitude: shelter.location.latitude, longitude: shelter.location.longitude, address: shelter.location.address || data.address };
    }
    return (await StorageLocation.create([{ ...data, createdBy: req.user!.id }], { session }))[0];
  });
  res.status(201).json({ storage: result });
});
export const bindStorage = asyncHandler(async (req: AuthRequest, res: Response) => {
  await transaction(async session => {
    const storage = await StorageLocation.findById(req.body.storageId).session(session);
    const resource = await Resource.findById(req.body.resourceId).session(session);
    if (!storage || !resource) throw createError('Storage or resource not found', 404);
    if (resource.storageId) {
      if (String(resource.storageId) === String(storage._id)) return;
      throw createError('Stock already has a storage location. Create a separate resource lot for another source.', 409);
    }
    if (resource.allocations.length || (resource.shelterReserved || 0)) throw createError('Release active allocations before linking storage', 409);
    if (storage.shelterId) await activeShelter(storage.shelterId, session);
    resource.storageId = storage._id; resource.logisticsLinked = true;
    resource.location = { latitude: storage.latitude, longitude: storage.longitude, address: storage.address };
    await resource.save({ session });
  });
  res.json({ success: true });
});
export const createNeed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const need = await transaction(async session => {
    await activeShelter(req.body.shelterId, session);
    return (await ShelterNeed.create([{ ...req.body, createdBy: req.user!.id }], { session }))[0];
  });
  res.status(201).json({ need });
});

export async function suggestionsForNeed(id: string) {
  checkId(id);
  const need = await ShelterNeed.findById(id).lean();
  if (!need) throw createError('Shelter need not found', 404);
  const shelter = await Shelter.findById(need.shelterId).lean();
  if (!shelter) throw createError('Shelter not found', 404);
  const resources = await Resource.find({ category: need.category, availableQuantity: { $gt: 0 }, status: { $ne: 'MAINTENANCE' }, storageId: { $exists: true } }).lean();
  const storage = await StorageLocation.find({ _id: { $in: resources.map(r => r.storageId) } }).lean();
  const active = await Shelter.find({ _id: { $in: storage.map(s => s.shelterId).filter(Boolean) }, status: { $ne: 'INACTIVE' } }).select('_id').lean();
  const activeIds = new Set(active.map(s => String(s._id)));
  const candidates = resources.filter(r => matchesNeed(r, need)).flatMap(r => {
    const source = storage.find(s => String(s._id) === String(r.storageId));
    if (!source || String(source.shelterId) === String(need.shelterId) || (source.shelterId && !activeIds.has(String(source.shelterId))) || shelter.status === 'INACTIVE') return [];
    return [{ resourceId: String(r._id), name: r.name, unit: r.unit, available: r.availableQuantity, storageName: source.name, address: source.address, distanceKm: distanceKm(source, shelter.location) }];
  }).sort((a,b) => a.distanceKm - b.distanceKm || a.resourceId.localeCompare(b.resourceId));
  let remaining = shortage(need);
  const suggestions = candidates.map(c => { const quantity = Math.min(remaining, c.available); remaining -= quantity; return { ...c, suggestedQuantity: quantity }; });
  return { need, shelter: { id: String(shelter._id), name: shelter.name, address: shelter.location.address, status: shelter.status }, shortage: shortage(need), uncovered: remaining, suggestions, calculatedAt: new Date().toISOString(), distanceNote: 'Straight-line distance, not road travel time or route safety. Suggestions do not reserve stock.' };
}
export const getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => { res.json(await suggestionsForNeed(req.params.id)); });

export const reserveTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transfer = await transaction(async session => {
    const existing = await SupplyTransfer.findOne({ createdBy: req.user!.id, requestKey: req.body.requestKey }).session(session);
    if (existing) {
      if (String(existing.needId) !== req.body.needId || String(existing.resourceId) !== req.body.resourceId || existing.quantity !== req.body.quantity) throw createError('Request key was already used for a different transfer', 409);
      return existing;
    }
    const need = await ShelterNeed.findById(req.body.needId).session(session);
    const resource = await Resource.findById(req.body.resourceId).session(session);
    if (!need || !resource) throw createError('Need or resource not found', 404);
    await activeShelter(need.shelterId, session);
    const storage = resource.storageId ? await StorageLocation.findById(resource.storageId).session(session) : null;
    if (!storage) throw createError('Link the resource to a storage location first', 400);
    if (String(storage.shelterId) === String(need.shelterId)) throw createError('Source and destination must differ', 400);
    if (storage.shelterId) await activeShelter(storage.shelterId, session);
    if (!matchesNeed(resource, need)) throw createError('Resource item, category and unit must match the need exactly', 400);
    const qty = req.body.quantity;
    if (resource.status === 'MAINTENANCE' || qty > resource.availableQuantity || qty > shortage(need)) throw createError('Stock or remaining demand changed. Refresh suggestions.', 409);
    resource.availableQuantity -= qty; resource.shelterReserved = (resource.shelterReserved || 0) + qty; resource.logisticsLinked = true;
    need.committed += qty;
    await resource.save({ session }); await need.save({ session });
    const created = (await SupplyTransfer.create([{ ...req.body, storageId: storage._id, shelterId: need.shelterId, createdBy: req.user!.id }], { session }))[0];
    await StockMovement.create([{ action: 'RESERVED', resourceId: resource._id, shelterId: need.shelterId, transferId: created._id, quantity: qty, actorId: req.user!.id, requestKey: String(created._id) + ':RESERVED' }], { session });
    return created;
  });
  res.status(201).json({ transfer });
});
export const transitionTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  checkId(req.params.id);
  const transfer = await transaction(async session => {
    const transfer = await SupplyTransfer.findById(req.params.id).session(session);
    if (!transfer) throw createError('Transfer not found', 404);
    const next = req.body.status;
    try { assertTransferAction(transfer.status!, next); } catch { throw createError('Transfer cannot move to that status', 409); }
    if (transfer.status === next) return transfer;
    const need = await ShelterNeed.findById(transfer.needId).session(session);
    const resource = await Resource.findById(transfer.resourceId).session(session);
    if (!need || !resource) throw createError('Linked inventory record is missing', 409);
    const qty = transfer.quantity;
    if (next === 'DISPATCHED') {
      if (resource.status === 'MAINTENANCE') throw createError('Resource is under maintenance', 409);
      await activeShelter(transfer.shelterId, session);
      const source = await StorageLocation.findById(transfer.storageId).session(session);
      if (!source) throw createError('Source storage is missing', 409);
      if (source.shelterId) await activeShelter(source.shelterId, session);
      resource.quantity -= qty; resource.shelterReserved = (resource.shelterReserved || 0) - qty;
      transfer.dispatchedAt = new Date(); await resource.save({ session });
    } else if (next === 'CANCELLED') {
      resource.availableQuantity += qty; resource.shelterReserved = (resource.shelterReserved || 0) - qty; need.committed -= qty;
      transfer.cancelledAt = new Date(); await resource.save({ session }); await need.save({ session });
    } else {
      // Receipt records what physically arrived, even if the shelter was subsequently deactivated.
      await ShelterStock.findOneAndUpdate({ shelterId: transfer.shelterId, resourceId: transfer.resourceId }, { $inc: { quantity: qty }, $setOnInsert: { consumed: 0 } }, { upsert: true, session, runValidators: true });
      need.committed -= qty; need.fulfilled += qty; transfer.receivedAt = new Date(); await need.save({ session });
    }
    transfer.status = next; await transfer.save({ session });
    await StockMovement.create([{ action: next, resourceId: transfer.resourceId, shelterId: transfer.shelterId, transferId: transfer._id, quantity: qty, actorId: req.user!.id, requestKey: String(transfer._id) + ':' + next }], { session });
    return transfer;
  });
  res.json({ transfer });
});
export const consumeStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  await transaction(async session => {
    const key = req.user!.id + ':' + req.body.requestKey;
    const previous = await StockMovement.findOne({ requestKey: key }).session(session);
    const stock = await ShelterStock.findById(req.body.stockId).session(session);
    if (!stock) throw createError('Shelter stock not found', 404);
    if (previous) {
      if (String(previous.resourceId) !== String(stock.resourceId) || String(previous.shelterId) !== String(stock.shelterId) || previous.quantity !== req.body.quantity || previous.notes !== req.body.notes) throw createError('Request key already used', 409);
      return;
    }
    if (req.body.quantity > stock.quantity) throw createError('Consumption exceeds stock physically received', 409);
    stock.quantity -= req.body.quantity; stock.consumed += req.body.quantity; await stock.save({ session });
    await StockMovement.create([{ action: 'CONSUMED', resourceId: stock.resourceId, shelterId: stock.shelterId, quantity: req.body.quantity, actorId: req.user!.id, requestKey: key, notes: req.body.notes }], { session });
  });
  res.json({ success: true });
});
