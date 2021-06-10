import Twilio from "twilio";
import Client from "../models/client";
import * as Sentry from "@sentry/node";
import axios from "axios";
import CallAction from "../models/callaction";
import { mixpanel } from "../app";
import { getTextWithEmojisEncoded } from "../utils/misc";
import { sentryException } from "../utils/customSentry";

require("dotenv").config();

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_API_KEY;
const twilio = new Twilio(accountSid, authToken);

export async function sendSMS(fromNumber, toNumber, message) {
  let encodedMessage = getTextWithEmojisEncoded(message);
  await twilio.messages
    .create({
      body: encodedMessage,
      from: fromNumber,
      to: toNumber,
    })
    .catch((error) => {
      console.log(error);
      Sentry.captureException(error);
      throw error;
    });
}

export function sendSMSAsync(fromNumber, toNumber, message) {
  let encodedMessage = getTextWithEmojisEncoded(message);

  twilio.messages
    .create({
      body: encodedMessage,
      from: fromNumber,
      to: toNumber,
    })
    .catch((error) => {
      console.log(error);
      Sentry.captureException(error);
    });
}

export async function sendSMSFromSlack(
  fromNumber,
  toNumber,
  message,
  responseURL,
  isChannelBased
) {
  let messageSent = false;
  try {
    let encodedMessage = getTextWithEmojisEncoded(message);

    await twilio.messages.create({
      body: encodedMessage,
      from: fromNumber,
      to: toNumber,
    });
    messageSent = true;
  } catch (error) {
    Sentry.captureException(error);
    console.log(error);
  }

  const successMessage = "Successfully sent your message";
  const errorMessage = `From FounderPhone: Well, this is embarassing. I couldn't send your message. Contact support@founderphone.com for help`;
  let messageToSend = messageSent ? successMessage : errorMessage;
  if (isChannelBased) {
    try {
      let response = await axios.post(
        responseURL,
        {
          text: messageToSend,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data);
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
    }
  }
}

export async function getPhoneNumber(clientEmail) {
  // temporary hack to use up already purchased phone numbers
  // let number;
  // let foundNewNumber = false;
  // while (!foundNewNumber && purchasedNumbers.length > 0) {
  //   number = purchasedNumbers.pop();
  //   let numberCount = await Client.find({ twilioPhoneNumber: number }).count();
  //   if (numberCount === 0) {
  //     foundNewNumber = true;
  //   }
  // }
  // if (foundNewNumber) {
  //   await assignPhoneNumber(number, clientEmail);
  //   return number;
  // }
  // end hack

  // Sentry.captureException(new Error("Used up all pre-bought numbers"));

  let phoneNumbers = await twilio
    .availablePhoneNumbers("US")
    .local.list({ areaCode: 510, limit: 1 });
  savePhoneNumber(phoneNumbers[0].phoneNumber, clientEmail);
  return phoneNumbers[0].phoneNumber;
}

export async function releasePhoneNumber(phoneNumber) {
  twilio.incomingPhoneNumbers(phoneNumber.sid).remove();
}

function savePhoneNumber(phoneNumber, clientEmail) {
  twilio.incomingPhoneNumbers
    .create({
      phoneNumber: phoneNumber,
      smsUrl: process.env.TWILIO_WEBHOOK,
      voiceUrl: process.env.TWILIO_CALL_FORWARD,
      friendlyName: clientEmail,
    })
    .then((incoming_phone_number) => console.log(incoming_phone_number.sid));
}

export function getTwilioCallWaitingResponse() {
  const response = new Twilio.twiml.VoiceResponse();

  response.play(
    {
      loop: 20,
    },
    "https://www.tones7.com/media/old_telephone.mp3"
  );

  return response.toString();
}

export async function redirectCall(callSid, phoneNumber) {
  const call = await twilio.calls(callSid);
  const redirectCall = new Twilio.twiml.VoiceResponse();
  redirectCall.dial(phoneNumber);
  await call.update({ twiml: redirectCall.toString() });
}

export async function checkIfCallIsInProgress(callSid) {
  const call = await twilio.calls(callSid).fetch();
  if (call && call.status === "in-progress") {
    return true;
  }
  return false;
}

export async function assignPhoneNumber(phoneNumber, clientEmail) {
  let sid = await getPhoneNumberDetails(phoneNumber);

  await twilio.incomingPhoneNumbers(sid).update({
    friendlyName: clientEmail,
    smsUrl: process.env.TWILIO_WEBHOOK,
    voiceUrl: process.env.TWILIO_CALL_FORWARD,
  });
}

export async function getPhoneNumberDetails(phoneNumber) {
  let incomingPhoneNumbers = await twilio.incomingPhoneNumbers.list({
    phoneNumber: phoneNumber,
    limit: 1,
  });

  return incomingPhoneNumbers[0].sid;
}

export async function callExpired(clientId, callSid) {
  let client = await Client.findById(clientId);

  let callAction = await CallAction.findOne({
    client: clientId,
    callSid: callSid,
  });
  if (!callAction.callRedirected) {
    if (client.callRedirection.callRedirectNumber) {
      redirectCall(callSid, client.callRedirection.callRedirectNumber);
      mixpanel.track(
        "call forwarded to slack but no one answered so default redirect",
        {
          distinct_id: client.email,
          clientPhone: client.twilioNumber,
        }
      );
    } else {
      rejectCall(callSid);
      mixpanel.track("call forwarded but busy", {
        distinct_id: client.email,
        clientPhone: client.twilioNumber,
      });
    }
  }
}

export async function rejectCall(callSid) {
  const call = await twilio.calls(callSid);
  const rejectCall = new Twilio.twiml.VoiceResponse();
  rejectCall.say("The number you dialed is busy. Try again later");
  rejectCall.reject();
  await call.update({ twiml: rejectCall.toString() });
}

export function getRejectCallResponse() {
  const rejectCall = new Twilio.twiml.VoiceResponse();
  rejectCall.say("The number you dialed is busy. Try again later");
  rejectCall.reject();
  return rejectCall.toString();
}
