import { z } from "zod";
import { RESOURCE_CATEGORIES } from "../models/Resource";
import { objectIdSchema, sanitizeInputText } from "./validators";
const text = (min: number, max: number) =>
  z
    .string()
    .max(max * 4)
    .trim()
    .transform(sanitizeInputText)
    .pipe(z.string().min(min).max(max));
const quantity = z.number().int().positive().max(1000000000);
export const storageSchema = z
  .object({
    name: text(2, 120),
    kind: z.enum(["WAREHOUSE", "SHELTER"]),
    shelterId: objectIdSchema.optional(),
    address: text(3, 300),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .refine(
    (v) => (v.kind === "SHELTER" ? !!v.shelterId : !v.shelterId),
    "Shelter storage requires a shelter; warehouse storage must not have one",
  );
export const bindStorageSchema = z.object({
  resourceId: objectIdSchema,
  storageId: objectIdSchema,
});
export const needSchema = z.object({
  requestKey: z.string().uuid().optional(),
  shelterId: objectIdSchema,
  item: text(2, 120),
  category: z.enum(["Food", "Water", "Medical", "Shelter Supplies", "Other"]),
  unit: text(1, 40),
  requested: quantity,
  urgency: z.enum(["NORMAL", "HIGH", "CRITICAL"]),
  notes: text(0, 500).optional(),
});
export const reserveSchema = z.object({
  needId: objectIdSchema,
  resourceId: objectIdSchema,
  quantity,
  requestKey: z.string().uuid(),
  sendNow: z.boolean().default(false),
});
export const transitionSchema = z.object({
  status: z.enum([
    "DISPATCHED",
    "RECEIVED",
    "CANCELLED",
    "RETURNED",
    "DAMAGED",
  ]),
  quantity: quantity.optional(),
  requestKey: z.string().uuid().optional(),
  notes: text(3, 500).optional(),
});
export const consumeSchema = z.object({
  stockId: objectIdSchema,
  quantity,
  notes: text(3, 500),
  requestKey: z.string().uuid(),
});
