import { Schema, model } from "mongoose";
const schema = new Schema(
  {
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    personId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 1200 },
    requestKey: { type: String, required: true },
  },
  { timestamps: true },
);
schema.index({ senderId: 1, requestKey: 1 }, { unique: true });
schema.index({ incidentId: 1, personId: 1, createdAt: 1 });
export const CoordinationMessage = model("CoordinationMessage", schema);
