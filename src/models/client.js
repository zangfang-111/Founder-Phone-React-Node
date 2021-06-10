import mongoose from "mongoose";
import { planTypes, slackMessageFormat } from "../utils/types";
const Schema = mongoose.Schema;

// Client is the account holder who signed up on our portal
const clientSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  firebaseUserId: {
    type: String,
    unique: true,
    required: true,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  payments: [
    {
      amount: Number,
      date: Date,
    },
  ],
  stripeCustomerId: { type: String },
  billingDetails: {
    currentPlan: { type: String, default: planTypes.TRIAL },
    subscribedOn: { type: Schema.Types.Date, default: new Date() },
    subscriptionId: { type: Schema.Types.String, default: "" },
    requestForDowngrade: { type: Schema.Types.Boolean, default: false },
    expirationDate: { type: Schema.Types.Date },
    nextPlan: { type: Schema.Types.String, default: "" },
    promosApplied: [String],
  },
  twilioPhoneNumber: {
    type: String,
    default: "",
  },
  slack: {
    teamName: String,
    teamId: String,
    appId: String,
    accessToken: String,
    userAccessToken: String,
    createPrivateChannel: {
      type: Schema.Types.Boolean,
      default: false,
    },
    defaultRespondents: [
      {
        type: Schema.Types.String,
      },
    ],
    messageFormat: {
      type: Schema.Types.String,
      default: slackMessageFormat.CHANNEL,
    },
    defaultChannelId: {
      type: Schema.Types.String,
      default: "",
    },
  },
  callRedirection: {
    callRedirectNumber: {
      type: String,
      default: "",
    },
    forwardToSlackFirst: {
      type: Schema.Types.Boolean,
      default: false,
    },
  },
  google: {
    accessToken: String,
  },
  hubspot: {
    accessToken: String,
    refreshToken: String,
  },
  signedupOn: {
    type: Schema.Types.Date,
    default: Date.now,
  },
});

const Client = mongoose.model("Client", clientSchema);

export default Client;
