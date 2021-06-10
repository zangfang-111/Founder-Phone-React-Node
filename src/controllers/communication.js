import { sendSMS } from "../controllers/twilioFunctions";
import { getSharedPublicURL } from "../controllers/slackFunctions";
import PhoneMapping from "../models/phonemapping";
import Slack from "slack";
import { mixpanel } from "../app";
import Message from "../models/message";
import * as Sentry from "@sentry/node";
import { sentryException } from "../utils/customSentry";
import { callWebhook } from "./webhook";

const CONTACT_MESSAGE =
  "Please contact support@founderphone.com or text for help";

export async function reply(client, message, files, channel) {
  var cleanedMessage = message.replace(/<@(.*?)>/g, "").trim();

  mixpanel.track("received message from slack", {
    distinct_id: client.email,
    clientPhone: client.twilioPhoneNumber,
    clientSlack: client.slack.teamName,
  });

  let response = await Slack.conversations.info({
    token: client.slack.accessToken,
    channel: channel,
  });

  let channelId = response.channel.id;

  let mapping = await PhoneMapping.findOne({
    channelId: channelId,
  });

  if (!mapping) {
    Slack.chat.postMessage({
      channel: channel,
      token: client.slack.accessToken,
      text:
        "From FounderPhone: Hmmm... I can't find a phone number that maps to this channel. " +
        CONTACT_MESSAGE,
    });
    return;
  }

  let attachmentURL = [];
  if (files) {
    for (let file of files) {
      let publicURLResponse = await getSharedPublicURL(
        file.id,
        client.slack.userAccessToken
      );
      if (publicURLResponse.success) {
        attachmentURL.push(publicURLResponse.publicURL);
      } else {
        Slack.chat.postMessage({
          channel: channel,
          token: client.slack.accessToken,
          text:
            "From FounderPhone: Well, this is embarassing. I couldn't send your attachment. " +
            CONTACT_MESSAGE,
        });
      }
    }
  }

  cleanedMessage += attachmentURL.join(" ");

  let phoneNumber = mapping.userPhoneNumber;

  if (cleanedMessage.length === 0) {
    Slack.chat.postMessage({
      channel: channel,
      token: client.slack.accessToken,
      text: "From FounderPhone: You can't send a blank message",
    });
    return;
  }

  try {
    await sendSMS(client.twilioPhoneNumber, phoneNumber, cleanedMessage);

    callWebhook(client._id, "SMS", {
      body: cleanedMessage,
      from: client.twilioPhoneNumber,
      to: phoneNumber,
    });

    let fpPhoneMapping = await PhoneMapping.findOne({
      userPhoneNumber: phoneNumber,
      client: client._id,
    });

    let message = new Message({
      client: client._id,
      fromPhoneMapping: fpPhoneMapping._id,
      toPhoneMapping: mapping._id,
      message: cleanedMessage,
      createdOn: Date.now(),
    });

    await message.save();

    mixpanel.track("sent text to customer", {
      distinct_id: client.email,
      clientPhone: client.twilioPhoneNumber,
      customerPhone: phoneNumber,
    });
  } catch (error) {
    // Sentry.captureException(error);
    sentryException(error, client.email);
    console.log(error);
    Slack.chat.postMessage({
      channel: channel,
      token: client.slack.accessToken,
      text:
        "*From FounderPhone:* Well, this is embarassing. I couldn't send your message. " +
        CONTACT_MESSAGE,
    });
  }
}

export async function replyViaThread(
  client,
  message,
  files,
  messageId,
  channel
) {
  var cleanedMessage = message.replace(/<@(.*?)>/g, "").trim();

  mixpanel.track("received message from slack in thread", {
    distinct_id: client.email,
    clientPhone: client.twilioPhoneNumber,
    clientSlack: client.slack.teamName,
  });

  if (!messageId) {
    Slack.chat.postMessage({
      channel: client.slack.defaultChannelId,
      token: client.slack.accessToken,
      text:
        "*From FounderPhone:* You have to respond to a thread to reply to a text. You can change your settings for this Slack at founderphone.com if you want each channel to be tied to a phone number instead. " +
        CONTACT_MESSAGE,
    });
    return;
  }

  let mapping = await PhoneMapping.findOne({
    client: client._id,
    messageId: messageId,
  });

  if (!mapping) {
    Slack.chat.postMessage({
      channel: channel,
      token: client.slack.accessToken,
      text:
        "*From FounderPhone:* Hmmm... I can't find a phone number that maps to this thread. " +
        CONTACT_MESSAGE,
    });
    return;
  }

  let attachmentURL = [];
  if (files) {
    for (let file of files) {
      let publicURLResponse = await getSharedPublicURL(
        file.id,
        client.slack.userAccessToken
      );
      if (publicURLResponse.success) {
        attachmentURL.push(publicURLResponse.publicURL);
      } else {
        Slack.chat.postMessage({
          channel: channel,
          token: client.slack.accessToken,
          text:
            "*From FounderPhone:* Well, this is embarassing. I couldn't send your attachment. " +
            CONTACT_MESSAGE,
        });
      }
    }
  }

  cleanedMessage += attachmentURL.join(" ");

  let phoneNumber = mapping.userPhoneNumber;

  if (cleanedMessage.length === 0) {
    Slack.chat.postMessage({
      channel: channel,
      token: client.slack.accessToken,
      text: "*From FounderPhone:* You can't send a blank message",
    });
    return;
  }

  try {
    await sendSMS(client.twilioPhoneNumber, phoneNumber, cleanedMessage);

    callWebhook(client._id, "SMS", {
      body: cleanedMessage,
      from: client.twilioPhoneNumber,
      to: phoneNumber,
    });

    mixpanel.track("sent text to customer", {
      distinct_id: client.email,
      clientPhone: client.twilioPhoneNumber,
      customerPhone: phoneNumber,
    });
  } catch (error) {
    Sentry.captureException(error);
    console.log(error);
    Slack.chat.postMessage({
      channel: channel,
      token: client.slack.accessToken,
      text:
        "*From FounderPhone:* Well, this is embarassing. I couldn't send your message. " +
        CONTACT_MESSAGE,
    });
  }
}
