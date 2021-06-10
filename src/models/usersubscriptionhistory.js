import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSubscriptionHistorySchema = new mongoose.Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
  },
  plan: {
    type: String,
  },
  subscribedOn: {
    type: Schema.Types.Date,
  },
  unsubscribedOn: {
    type: Schema.Types.Date,
    default: new Date(),
  },
});

const UserSubscriptionHistory = mongoose.model(
  "UserSubscriptionHistory",
  userSubscriptionHistorySchema
);

export default UserSubscriptionHistory;
