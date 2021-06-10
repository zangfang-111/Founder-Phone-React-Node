import mongoose from "mongoose";
import { slackMessageFormat } from "../utils/types";

const Schema = mongoose.Schema;

const phoneMappingSchema = new mongoose.Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  userPhoneNumber: {
    type: Schema.Types.String,
    default: "",
    required: true,
  },
  channelId: {
    type: Schema.Types.String,
    default: "",
  },
  channelName: {
    type: Schema.Types.String,
    default: "",
  },
  firstMessageReceived: {
    type: Schema.Types.Boolean,
    default: false,
  },
  // If message format is thread, store message to respond to
  messageId: {
    type: Schema.Types.String,
    default: "",
  },
  defaultChannelId: {
    type: Schema.Types.String,
    default: "",
  },
});

const PhoneMapping = mongoose.model("PhoneMapping", phoneMappingSchema);

export default PhoneMapping;
