import { Schema, model } from 'mongoose';
const ref = (name: string) => ({ type: Schema.Types.ObjectId, ref: name, required: true });
const count = { type: Number, required: true, min: 0, validate: Number.isSafeInteger };
const options = { timestamps: true, optimisticConcurrency: true };
const storageSchema = new Schema({
  name: { type: String, required: true, maxlength: 120 }, kind: { type: String, enum: ['WAREHOUSE', 'SHELTER'], required: true },
  shelterId: { type: Schema.Types.ObjectId, ref: 'Shelter' }, address: { type: String, required: true, maxlength: 300 },
  latitude: { type: Number, required: true, min: -90, max: 90 }, longitude: { type: Number, required: true, min: -180, max: 180 },
  createdBy: ref('User'),
}, options);
export const StorageLocation = model('StorageLocation', storageSchema);
const needSchema = new Schema({
  shelterId: ref('Shelter'), item: { type: String, required: true }, category: { type: String, required: true }, unit: { type: String, required: true },
  requested: count, committed: { ...count, default: 0 }, fulfilled: { ...count, default: 0 },
  urgency: { type: String, enum: ['NORMAL', 'HIGH', 'CRITICAL'], default: 'NORMAL' },
  notes: { type: String, maxlength: 500 }, createdBy: ref('User'),
}, options);
export const ShelterNeed = model('ShelterNeed', needSchema);
const transferSchema = new Schema({
  needId: ref('ShelterNeed'), resourceId: ref('Resource'), storageId: ref('StorageLocation'), shelterId: ref('Shelter'),
  quantity: { ...count, min: 1 }, status: { type: String, enum: ['RESERVED', 'DISPATCHED', 'RECEIVED', 'CANCELLED'], default: 'RESERVED' },
  requestKey: { type: String, required: true }, createdBy: ref('User'),
  dispatchedAt: Date, receivedAt: Date, cancelledAt: Date,
}, options);
transferSchema.index({ createdBy: 1, requestKey: 1 }, { unique: true });
export const SupplyTransfer = model('SupplyTransfer', transferSchema);
const balanceSchema = new Schema({ shelterId: ref('Shelter'), resourceId: ref('Resource'), quantity: { ...count, default: 0 }, consumed: { ...count, default: 0 } }, options);
balanceSchema.index({ shelterId: 1, resourceId: 1 }, { unique: true });
export const ShelterStock = model('ShelterStock', balanceSchema);
const ledgerSchema = new Schema({
  action: { type: String, enum: ['RESERVED', 'DISPATCHED', 'RECEIVED', 'CANCELLED', 'CONSUMED'], required: true },
  resourceId: ref('Resource'), shelterId: ref('Shelter'), transferId: { type: Schema.Types.ObjectId, ref: 'SupplyTransfer' },
  quantity: { ...count, min: 1 }, actorId: ref('User'), requestKey: { type: String, required: true, unique: true }, notes: { type: String, maxlength: 500 },
}, { timestamps: true });
export const StockMovement = model('StockMovement', ledgerSchema);
// Persistent rate limiting across API instances; no prompts or credentials are stored.
export const AssistantQuota = model('AssistantQuota', new Schema({ _id: String, day: String, count: Number, lastAt: Date }));
