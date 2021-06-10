import mongoose from "mongoose";

const Schema = mongoose.Schema;

const webhookSchema = new mongoose.Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    url: {
      type: Schema.Types.String,
      default: "",
      required: false,
    },
    isActive: {
      type: Schema.Types.Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

const webhookLogSchema = new mongoose.Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    requestUrl: {
      type: Schema.Types.String,
      default: true,
      required: true,
    },
    requestPayload: {
      type: Schema.Types.String,
      default: true,
      required: true,
      get: (data) => {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      },
      set: (data) => {
        return JSON.stringify(data);
      },
    },
    responseStatus: {
      type: Schema.Types.Number,
      default: true,
      required: true,
    },
    responseData: {
      type: Schema.Types.String,
      default: true,
      required: true,
      get: (data) => {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      },
      set: (data) => {
        return JSON.stringify(data);
      },
    },
  },
  { timestamps: true }
);

export const Webhook = mongoose.model("Webhook", webhookSchema);
export const WebhookLog = mongoose.model("WebhookLog", webhookLogSchema);
