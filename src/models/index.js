import mongoose from "mongoose";
import Client from "./client";
import UserSubscriptionHistory from "./usersubscriptionhistory";
import PhoneMapping from "../models/phonemapping";
import CallAction from "../models/callaction";
import Contact from "../models/contact";
import Promo from "../models/promo";
import MessageTemplate from "../models/messagetemplate";

const connectDb = () => {
  return mongoose.connect(process.env.DATABASE_URL);
};

const models = {
  Client,
  UserSubscriptionHistory,
  PhoneMapping,
  Contact,
  Promo,
  CallAction,
  MessageTemplate,
};

export { connectDb };

export default models;
