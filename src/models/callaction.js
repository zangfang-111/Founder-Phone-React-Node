import mongoose from "mongoose";
const Schema = mongoose.Schema;

const callActionSchema = new mongoose.Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
  },
  callSid: {
    type: String,
    default: "",
  },
  callRedirected: {
    type: Schema.Types.Boolean,
    default: false,
  },
});

const CallAction = mongoose.model("CallAction", callActionSchema);

export default CallAction;
