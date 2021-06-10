import * as admin from "firebase-admin";
import Client from "../models/client";
import Contact from "../models/contact";
import { addToMailchimp } from "./mail";
import { getPhoneNumber } from "../controllers/twilioFunctions";
import moment from "moment";
import { agenda, JOB_TYPES } from "./agenda";
import mongoose from "mongoose";

require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert({
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    project_id: process.env.FIREBASE_PROJECT_ID,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export async function verifyClient(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function createClient(firebaseUserId, params) {
  const userRecord = await admin.auth().getUser(firebaseUserId);
  const firebaseUser = userRecord.toJSON();

  const id = mongoose.Types.ObjectId();

  var client = new Client({
    _id: id,
    email: firebaseUser.email,
    firebaseUserId: firebaseUserId,
    ...params,
  });

  // Start trial
  let trialReminderDate = moment();
  trialReminderDate.add(5, "days");

  let trialEndDate = moment();
  trialEndDate.add(7, "days");

  const data = { clientId: id.toString() };
  agenda.schedule(trialReminderDate, JOB_TYPES.TRIAL_PERIOD_REMINDER, data);
  agenda.schedule(trialEndDate, JOB_TYPES.END_TRIAL, data);
  client.twilioPhoneNumber = await getPhoneNumber(client.email);

  // Default add us as a contact
  var us = new Contact({
    client: client._id,
    firstName: "FounderPhone",
    lastName: "",
    email: "support@founderphone.com",
    phoneNumber: "+15106302297",
  });
  await us.save();

  if (process.env.NODE_ENV === "production") {
    try {
      addToMailchimp(client.email);
    } catch (error) {
      console.log(error);
    }
  }

  await client.save();
}
