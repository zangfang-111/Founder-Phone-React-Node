import express from "express";
import { body } from "express-validator";
import asyncHandler from "express-async-handler";
import Client from "../models/client";
import { verifyClient, createClient } from "../controllers/firebaseFunctions";
import {
  movedToPaidPlan,
  createCustomerWallet,
  updateCustomerWallet,
  changePlan,
  startPromo,
} from "../controllers/stripeFunctions";
import querystring from "query-string";
import axios from "axios";
import {
  getSlackRedirectUrl,
  checkUserExistsInSlack,
  listSlackUsers,
  sendResponseToSlack,
  sendSlackPhoneNumberModal,
  sendMessageToSlack,
  convertToAtMentions,
  createChannelAndInviteDefaultRespondants,
  checkChannelExistsInWorkspace,
  getSlackChannelList,
  inviteBotUserToChannel,
  inviteUserToChannel,
} from "../controllers/slackFunctions";
import { ANSWER_CALL, getIncomingCallBlock } from "../utils/slackBlocks";
import {
  getPhoneNumber,
  sendSMSFromSlack,
  getTwilioCallWaitingResponse,
  redirectCall,
  checkIfCallIsInProgress,
  sendSMS,
  sendSMSAsync,
  callExpired,
  getRejectCallResponse,
} from "../controllers/twilioFunctions";
import { planTypes, slackMessageFormat } from "../utils/types";
import PhoneMapping from "../models/phonemapping";
import Slack from "slack";
import {
  joinChannel,
  renameChannelsToContactNames,
  getNamedChannel,
} from "../controllers/slackFunctions";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  sentSMSFailureEmail,
  sendSMSInEmailForUnpaidClients,
} from "../controllers/mail";
import { mixpanel } from "../app";
import Contact from "../models/contact";
import { reply, replyViaThread } from "../controllers/communication";
import {
  getOauth2Client,
  getGoogleContacts,
} from "../controllers/googleFunctions";
import * as Sentry from "@sentry/node";
import csvtojsonV2 from "csvtojson";
import vcardParser from "../utils/vcfParser";
import {
  getPhoneNumbersFromCsvContact,
  getPhoneNumbersFromVCF,
  getEmailAndOrganizationFromVCF,
  getOrganizationFromCSV,
  getEmailFromCSV,
  custom_sort,
} from "../utils/misc";
import { parseFullName } from "parse-full-name";
import {
  getHubSpotAuthorizationUrl,
  getAccessToken,
  syncContactsFromHubSpot,
} from "../controllers/hubSpotFunctions";
import { formatPhoneNumber } from "../utils/phone";
import Promo from "../models/promo";
import CallAction from "../models/callaction";
import Message from "../models/message";
import MessageTemplate from "../models/messagetemplate";
import { sentryException } from "../utils/customSentry";
import { generateSlackChannelName } from "../utils/slack";
import { validate } from "./utils";
import webhookRouter from "./webhook";
import { callWebhook } from "../controllers/webhook";

const HELP_CENTER_MESSAGE =
  "Check out https://help.founderphone.com for setup and usage instructions";

const CONTACT_MESSAGE = "Please contact support@founderphone.com for help";

const NOT_SUBSCRIBED_MESSAGE =
  "*From Founderphone*: You're not subscribed to FounderPhone. Please visit founderphone.com and subscribe to a plan to send a message";

var router = express.Router();

router.use("/webhooks", webhookRouter);

router.post(
  "/registerclient",
  [body("idToken").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    const client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      await createClient(firebaseUserId, {});
      return res.status(200).send({ newUser: true });
    } else {
      return res.status(200).send({ newUser: false });
    }
  })
);

//BILLING Related
router.post(
  "/clientaccount",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      res.status(400).send("Invalid client");
    }

    let defaultRespondents = [];

    if (client.slack && client.slack.defaultRespondents.length > 0) {
      defaultRespondents = client.slack.defaultRespondents;
    }

    mixpanel.people.set({
      $email: client.email,
      $last_login: new Date(),
    });

    let contactsSynced = await Contact.count({ client: client._id });

    return res.status(200).send({
      haveCardOnFile: client.stripeCustomerId !== undefined,
      payments: client.payments,
      currentPlan: client.billingDetails.currentPlan,
      requestForDowngrade: client.billingDetails.requestForDowngrade,
      expirationDate: client.billingDetails.expirationDate,
      nextPlan: client.billingDetails.nextPlan,
      phoneNumber: client.twilioPhoneNumber,
      teamName: client.slack.teamName,
      defaultRespondents: defaultRespondents,
      callRedirectNumber: client.callRedirection.callRedirectNumber,
      forwardToSlackFirst: client.callRedirection.forwardToSlackFirst,
      contactsSynced: contactsSynced,
      forwardText: client.callRedirection.forwardText,
      createPrivateChannel: client.slack.createPrivateChannel,
      messageFormat: client.slack.messageFormat,
      defaultChannelId: client.slack.defaultChannelId,
    });
  })
);

router.post(
  "/applypromo",
  [body("promo").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    const client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });

    if (!client) {
      return res.status(400).send("Invalid client");
    }

    const PROMO = "YC";

    if (req.body.promo.toUpperCase() !== PROMO) {
      return res.status(400).send({ message: "Invalid promo" });
    }

    if (client.billingDetails.promosApplied.includes(PROMO)) {
      return res
        .status(400)
        .send({ message: "You've already used this promo" });
    }

    var promo = await Promo.findOne({});

    if (!promo) {
      promo = new Promo();
    } else {
      promo.ycdealcount += 1;
    }
    await promo.save();

    if (promo.ycdealcount > 200) {
      return res
        .status(400)
        .send({ message: "We ran out of promos to give :-(" });
    }

    if (!client.twilioPhoneNumber) {
      client.twilioPhoneNumber = await getPhoneNumber(client.email);
    }
    await startPromo(client, PROMO);

    return res.status(200).send("Promo applied! You have 14 days free");
  })
);

router.post(
  "/subscribetoplan",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    const client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });

    if (!client) {
      return res.status(400).send("Invalid client");
    }

    // If client doesn't have a phone number, buy one
    if (!client.twilioPhoneNumber) {
      client.twilioPhoneNumber = await getPhoneNumber(client.email);
      await client.save();
    }

    let response = await movedToPaidPlan(client);

    if (response) {
      if (response.success) {
        return res.status(200).send({ message: "Subscribed!" });
      } else {
        sentryException(response.error, client.email);
        console.log(response.error);
        return res.status(400).send({ message: response.error });
      }
    } else {
      return res.status(400).send({ message: "Error. " + CONTACT_MESSAGE });
    }
  })
);

router.post(
  "/unsubscribetoplan",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    const client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });

    if (!client) {
      return res.status(400).send("Invalid client");
    }

    let response = await changePlan(client, planTypes.NOT_PAID);

    if (response) {
      if (response.success) {
        return res.status(200).send(response.message ? response.message : "");
      } else {
        Sentry.captureException(error);
        return res.status(400).send(response.error);
      }
    } else {
      return res.status(400).send("Error");
    }
  })
);

router.post(
  "/savecard",
  [body("stripeToken").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Invalid client");
    }

    let response = null;

    if (client.stripeCustomerId && client.stripeCustomerId !== "") {
      response = await updateCustomerWallet(
        client.stripeCustomerId,
        req.body.stripeToken
      );
    } else {
      response = await createCustomerWallet(client, req.body.stripeToken);
    }

    if (response) {
      if (response.success) {
        return res.status(200).send();
      } else {
        Sentry.captureException(response.error);
        return res.status(400).send(response.error);
      }
    }
  })
);

router.get(
  "/connecttoslack",
  [],
  asyncHandler(async (req, res, next) => {
    const firebaseUserId = await verifyClient(req.query.idToken);
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    let SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;

    res.redirect(
      "https://slack.com/oauth/v2/authorize?" +
        querystring.stringify({
          client_id: SLACK_CLIENT_ID,
          scope:
            "app_mentions:read,channels:join,channels:manage,channels:read,chat:write,commands,groups:read,groups:write,users:read,users:read.email",
          user_scope: "channels:read,files:read,files:write,groups:read",
          redirect_uri: getSlackRedirectUrl(),
          state: client._id,
        })
    );
  })
);

router.post(
  "/createslackaccesstoken",
  [body("code").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    let SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
    let SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

    var formData = querystring.stringify({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      redirect_uri: getSlackRedirectUrl(),
      code: req.body.code,
    });

    var contentLength = formData.length;

    try {
      var accessTokenResponse = await axios({
        headers: {
          "Content-Length": contentLength,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        url: "https://slack.com/api/oauth.v2.access",
        data: formData,
        method: "POST",
      });

      if (accessTokenResponse.status === 200) {
        let slackAlreadyAssociated = await Client.findOne({
          "slack.teamId": accessTokenResponse.data.team.id,
        });

        if (
          slackAlreadyAssociated &&
          !slackAlreadyAssociated._id.equals(client._id)
        ) {
          return res.status(200).send({
            slackAlreadyAssociated: true,
            clientEmail: slackAlreadyAssociated.email,
            twilioPhoneNumber: slackAlreadyAssociated.twilioPhoneNumber,
          });
        } else {
          client.slack = {
            teamName: accessTokenResponse.data.team.name,
            teamId: accessTokenResponse.data.team.id,
            appId: accessTokenResponse.data.app_id,
            accessToken: accessTokenResponse.data.access_token,
            userAccessToken: accessTokenResponse.data.authed_user.access_token,
            messageFormat: slackMessageFormat.CHANNEL,
            defaultChannelId: "",
          };
          await client.save();

          res
            .status(200)
            .send({ teamName: accessTokenResponse.data.team.name });
        }
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      res.status(400).send(error.response.data);
    }
  })
);

// Replies from Slack channels are handlede here
// See https://api.slack.com/apps/ASZP16544/event-subscriptions
router.post(
  "/founderphoneevent",
  [],
  asyncHandler(async (req, res, next) => {
    // For Slack to acknowledge endpoint
    if (req.body.challenge) {
      return res.status(200).send(req.body.challenge);
    }

    // Acknowledge event
    res.status(200).send();
    let appId = req.body.api_app_id;
    let teamId = req.body.team_id;
    let eventType = req.body.event.type;

    let client = await Client.findOne({
      "slack.teamId": teamId,
      "slack.appId": appId,
    });

    if (!client) {
      console.error("Client not registered with this Slack team: " + teamId);
      return;
    }

    if (eventType === "app_mention") {
      let message = req.body.event.text;
      let channel = req.body.event.channel;
      let files = null;
      if (req.body.event.upload) {
        files = req.body.event.files;
      }

      if (client.billingDetails.currentPlan === planTypes.NOT_PAID) {
        sendMessageToSlack(
          channel,
          client.slack.accessToken,
          NOT_SUBSCRIBED_MESSAGE
        );
        return;
      }

      if (client.slack.messageFormat === slackMessageFormat.CHANNEL) {
        reply(client, message, files, channel);
      } else {
        replyViaThread(
          client,
          message,
          files,
          req.body.event.thread_ts,
          channel
        );
      }
    } else if (eventType === "channel_rename") {
      let channelId = req.body.event.channel.id;
      let newName = req.body.event.channel.name;

      let phoneMapping = await PhoneMapping.findOne({
        client: client._id,
        channelId: channelId,
      });

      if (!phoneMapping) {
        // Irrelevant channel rename
        return;
      }

      phoneMapping.channelName = newName;
      phoneMapping.save();
    } else if (eventType === "app_uninstalled") {
      client.slack = {
        teamName: "",
        teamId: "",
        appId: "",
        accessToken: "",
        defaultRespondents: [],
      };
      await client.save();
    }
  })
);

router.post(
  "/deleteDefaultRespondent",
  [body("emailAddress").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    if (client.slack) {
      client.slack.defaultRespondents = client.slack.defaultRespondents.filter(
        (defaultRespondent) => {
          return defaultRespondent !== req.body.emailAddress;
        }
      );

      await client.save();

      return res.status(200).send();
    } else {
      Sentry.captureException("Tried to delete respondent without Slack");
      return res.status(400).send("Tried to delete respondent without Slack");
    }
  })
);

router.post(
  "/adddefaultrespondent",
  [body("defaultRespondents").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    let firstRespondentAdded = client.slack.defaultRespondents.length === 0;

    let defaultRespondents = req.body.defaultRespondents;

    const validDefaultRespondents = [];

    for (let defaultRespondent of defaultRespondents) {
      let userExistsResponse = await checkUserExistsInSlack(
        defaultRespondent,
        client.slack.accessToken
      );

      if (userExistsResponse.success) {
        validDefaultRespondents.push(defaultRespondent);
      } else {
        console.log(userExistsResponse.errorMessage);
        return res.status(400).send(userExistsResponse.errorMessage);
      }
    }

    client.slack.defaultRespondents = validDefaultRespondents;

    await client.save();

    // Send welcome message once a respondent is added
    if (firstRespondentAdded) {
      const OUR_NUMBER = "+15106302297";
      const MESSAGE =
        "Hi! This is a direct line to the founders at FounderPhone. Congrats on setting it up with Slack! Feel free to text us here if you need help with anything";

      await sendSMS(OUR_NUMBER, client.twilioPhoneNumber, MESSAGE);

      callWebhook(client._id, "SMS", {
        body: MESSAGE,
        from: OUR_NUMBER,
        to: client.twilioPhoneNumber,
      });
    }

    return res.status(200).send();
  })
);

router.post(
  "/addcallredirection",
  [
    body("callRedirectNumber").not().isEmpty(),
    body("forwardToSlackFirst").not().isEmpty(),
  ],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    client.callRedirection.callRedirectNumber = req.body.callRedirectNumber;
    client.callRedirection.forwardToSlackFirst = req.body.forwardToSlackFirst;

    await client.save();

    return res.status(200).send();
  })
);

router.post(
  "/sms",
  [],
  asyncHandler(async (req, res, next) => {
    console.log("Received sms for founder phone");
    let twilioNumber = req.body.To;
    let userPhoneNumber = req.body.From;

    let client = await Client.findOne({ twilioPhoneNumber: twilioNumber });

    if (!client) {
      Sentry.captureMessage("Trying to SMS unassigned number: " + twilioNumber);
      console.log("Trying to SMS unassigned number: " + twilioNumber);
      return res.status(400).send({ error: "Unassigned number" });
    }

    if (client.billingDetails.currentPlan === planTypes.NOT_PAID) {
      let fromNumber = userPhoneNumber;
      let contact = await Contact.findOne({
        client: client._id,
        phoneNumber: userPhoneNumber,
      });

      if (contact) {
        fromNumber = `${contact.firstName} ${contact.lastName}`;
      }

      sendSMSInEmailForUnpaidClients(client.email, fromNumber, req.body.Body);
      return res.status(400).send({ error: "Client not subscribed" });
    }

    if (!client.slack || !client.slack.accessToken) {
      Sentry.captureMessage(
        "Client is sending SMS but has not connected to Slack: " + client.email
      );
      console.log("Client has not connected Slack to FounderPhone");
      sentSMSFailureEmail(client.email, userPhoneNumber, req.body.Body);
      return res
        .status(400)
        .send({ error: "Client has not connected Slack to FounderPhone" });
    }

    mixpanel.track("received text from customer", {
      distinct_id: client.email,
      clientPhone: twilioNumber,
      customerPhone: userPhoneNumber,
    });

    // Check to see if we have a mapping of phone number to Slack channel already
    let phoneMapping = await PhoneMapping.findOne({
      client: client._id,
      userPhoneNumber: userPhoneNumber,
    });

    let channelName = "";
    channelName = userPhoneNumber.replace("+", "");
    channelName = generateSlackChannelName(channelName);

    // Look up this contact
    let contact = await Contact.findOne({
      client: client._id,
      phoneNumber: userPhoneNumber,
    });

    if (contact) {
      channelName = await getNamedChannel(
        contact.firstName + " " + contact.lastName,
        contact.company,
        client._id
      );
    }

    channelName = channelName.toLowerCase();

    let accessToken = client.slack.accessToken;

    let formattedPhoneNumber = parsePhoneNumberFromString(
      req.body.From
    ).formatNational();

    let textMessage = req.body.Body;
    let numberOfMedia = parseInt(req.body.NumMedia);

    let mediaAttachmentURLs = [];
    if (numberOfMedia > 0) {
      // attachments available
      for (
        let attachmentIndex = 0;
        attachmentIndex < numberOfMedia;
        attachmentIndex++
      ) {
        mediaAttachmentURLs.push(req.body[`MediaUrl${attachmentIndex}`]);
      }

      textMessage += "\n";
      for (let mediaUrl of mediaAttachmentURLs) {
        textMessage += mediaUrl;
        textMessage += "\n\n";
      }
    }

    let fromName = "";
    if (contact && contact.firstName) {
      fromName =
        contact.firstName +
        (contact.lastName ? " " + contact.lastName : "") +
        " at ";
    }

    await inviteBotUserToChannel(
      client.slack.defaultChannelId,
      client.slack.accessToken
    );

    let atMentionRepondents = await convertToAtMentions(
      client.slack.defaultRespondents,
      client.slack.accessToken
    );

    let accountManagerRepondents;

    if (contact && contact.accountManager) {
      accountManagerRepondents = await convertToAtMentions(
        [contact.accountManager],
        client.slack.accessToken
      );

      if (accountManagerRepondents) {
        atMentionRepondents = accountManagerRepondents;
      }
    }

    let channelId = "";
    let slackMessage = {
      text:
        atMentionRepondents +
        " *From " +
        fromName +
        formattedPhoneNumber +
        "*: " +
        textMessage +
        " ",
      token: client.slack.accessToken,
    };

    try {
      if (client.slack.messageFormat === slackMessageFormat.THREAD) {
        if (!phoneMapping) {
          phoneMapping = new PhoneMapping({
            client: client._id,
            userPhoneNumber: userPhoneNumber,
            defaultChannelId: client.slack.defaultChannelId,
          });
        } else {
          slackMessage["thread_ts"] = phoneMapping.messageId;
        }
        channelId = client.slack.defaultChannelId;
      } else {
        phoneMapping = await createChannelAndInviteDefaultRespondants(
          client,
          phoneMapping,
          channelName,
          userPhoneNumber
        );
        channelId = phoneMapping.channelId;
      }

      if (contact && contact.accountManager && accountManagerRepondents) {
        await inviteUserToChannel(
          contact.accountManager,
          channelId,
          client.slack.accessToken
        );
      }

      slackMessage["channel"] = channelId;

      let response = await Slack.chat.postMessage(slackMessage);

      if (
        client.slack.messageFormat === slackMessageFormat.THREAD &&
        (!phoneMapping.messageId ||
          client.slack.defaultChannelId !== phoneMapping.defaultChannelId)
      ) {
        phoneMapping.messageId = response.ts;
        phoneMapping.defaultChannelId = client.slack.defaultChannelId;
      }

      if (
        !phoneMapping.firstMessageReceived &&
        client.slack.messageFormat === slackMessageFormat.CHANNEL
      ) {
        phoneMapping.firstMessageReceived = true;

        await Slack.chat.postMessage({
          channel: channelId,
          token: accessToken,
          text:
            "*From FounderPhone:* You received your first message from " +
            formattedPhoneNumber +
            ". You can reply to them by typing `@founderphone` followed by your response in this channel. All other messages in this channel are for your team's eyes only",
        });
      }

      await phoneMapping.save();
    } catch (err) {
      console.log(err);
      sentSMSFailureEmail(
        client.email,
        parsePhoneNumberFromString(userPhoneNumber).formatNational(),
        req.body.Body
      );
    }

    mixpanel.track("forwarded message to slack", {
      distinct_id: client.email,
      clientPhone: twilioNumber,
      clientSlack: client.slack.teamName,
      customerPhone: userPhoneNumber,
      createdOn: Date.now(),
    });

    let fpPhoneMapping = await PhoneMapping.findOne({
      userPhoneNumber: userPhoneNumber,
      client: client._id,
    });

    let message = new Message({
      client: client._id,
      fromPhoneMapping: phoneMapping._id,
      toPhoneMapping: fpPhoneMapping._id,
      message: textMessage,
      createdOn: Date.now(),
    });

    await message.save();
    console.log("Posted in slack");

    // Forward SMS to configured redirection number
    // if (client.callRedirection.forwardText) {
    //   let callRedirectNumber = client.callRedirection.callRedirectNumber;
    //   let forwardMessage = `
    //     <Response>
    //       <Message to='${callRedirectNumber}'>${userPhoneNumber}: ${req.body.Body}</Message>
    //     </Response>`;
    //   return res.status(200).send(forwardMessage);
    // }

    return res.status(200).send("Posted in slack");
  })
);

router.post(
  "/getdefaultrespondents",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    const client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(200).send("Client not found");
    }

    let defaultRespondents = [];

    if (client.slack && client.slack.defaultRespondents.length > 0) {
      defaultRespondents = client.slack.defaultRespondents;
    }

    return res.status(200).send({
      defaultRespondents: defaultRespondents,
      currentPlan: client.billingDetails.currentPlan,
      teamName: client.slack.teamName,
    });
  })
);

router.get(
  "/slackusers",
  [],
  asyncHandler(async (req, res) => {
    const firebaseUserId = await verifyClient(req.query.idToken);
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    let usersResponse = await listSlackUsers(client.slack.accessToken);

    if (usersResponse.success) {
      return res.status(200).send({
        users: usersResponse.users,
      });
    } else {
      console.log(usersResponse.errorMessage);
      return res.status(400).send(usersResponse.errorMessage);
    }
  })
);

router.post(
  "/forwardcall",
  [],
  asyncHandler(async (req, res, next) => {
    console.log("Received call from customers");
    let callerNumber = req.body.Caller;
    let calledNumber = req.body.Called;
    let client = await Client.findOne({ twilioPhoneNumber: calledNumber });
    let callSid = req.body.CallSid;

    if (!client) {
      return res.status(400).send();
    }

    if (client.billingDetails.currentPlan === planTypes.NOT_PAID) {
      // if someone calls an unpaid client reject their call
      // optionally we can send an email notifying the client that
      // customers are reaching out to them through founderphone
      return res.status(200).send(getRejectCallResponse());
    }

    if (!client.callRedirection.callRedirectNumber) {
      return res.status(400).send();
    }

    let callRedirectNumber = client.callRedirection.callRedirectNumber;

    if (!client.callRedirection.forwardToSlackFirst) {
      mixpanel.track("forwarded call", {
        distinct_id: client.email,
        clientPhone: client.twilioPhoneNumber,
        redirectPhone: callRedirectNumber,
      });

      return res
        .status(200)
        .send(`<Response> <Dial> ${callRedirectNumber} </Dial> </Response>`);
    }

    mixpanel.track("forwarded call to slack", {
      distinct_id: client.email,
      clientPhone: client.twilioPhoneNumber,
    });

    let phoneMapping = await PhoneMapping.findOne({
      client: client._id,
      userPhoneNumber: callerNumber,
    });

    // let message = new Message({
    //   client: client._id,
    //   fromPhoneMapping: phoneMapping._id,
    //   isCall: true,
    //   createdOn: Date.now(),
    // });

    // await message.save();

    let channelName = callerNumber.replace("+", "");
    channelName = generateSlackChannelName(channelName);
    let formattedPhoneNumber = parsePhoneNumberFromString(
      callerNumber
    ).formatNational();

    let formattedRedirectNumber = parsePhoneNumberFromString(
      callRedirectNumber
    ).formatNational();

    const WAIT_TIME = 20000;

    let atMentionRepondents = await convertToAtMentions(
      client.slack.defaultRespondents,
      client.slack.accessToken
    );

    let channelId = "";

    let slackMessage = {
      text:
        atMentionRepondents +
        "You have an incoming call. You have " +
        WAIT_TIME / 1000 +
        " seconds to accept it before it's forwarded to " +
        formattedRedirectNumber,
      token: client.slack.accessToken,
    };

    if (client.slack.messageFormat === slackMessageFormat.THREAD) {
      if (!phoneMapping) {
        phoneMapping = new PhoneMapping({
          client: client._id,
          userPhoneNumber: userPhoneNumber,
          defaultChannelId: client.slack.defaultChannelId,
        });
      } else {
        slackMessage["thread_ts"] = phoneMapping.messageId;
      }
      channelId = client.slack.defaultChannelId;
    } else {
      phoneMapping = await createChannelAndInviteDefaultRespondants(
        client,
        phoneMapping,
        channelName,
        callerNumber
      );
      channelId = phoneMapping.channelId;
    }
    slackMessage["channel"] = channelId;

    await inviteBotUserToChannel(channelId, client.slack.accessToken);

    let response = await Slack.chat.postMessage(slackMessage);

    if (
      client.slack.messageFormat === slackMessageFormat.THREAD &&
      (!phoneMapping.messageId ||
        client.slack.defaultChannelId !== phoneMapping.defaultChannelId)
    ) {
      phoneMapping.messageId = response.ts;
      phoneMapping.defaultChannelId = client.slack.defaultChannelId;
    }

    await phoneMapping.save();

    let incomingCallBlock = getIncomingCallBlock(callSid, formattedPhoneNumber);

    slackMessage["text"] = `You have a call from ${formattedPhoneNumber}`;
    slackMessage["blocks"] = incomingCallBlock;

    Slack.chat.postMessage(slackMessage);

    let callAction = new CallAction({ client: client._id, callSid: callSid });
    await callAction.save();

    setTimeout(() => callExpired(client._id, callSid), WAIT_TIME);

    let waitResponse = getTwilioCallWaitingResponse();
    return res.status(200).send(waitResponse);
  })
);

router.get(
  "/connecttogoogle",
  [],
  asyncHandler(async (req, res, next) => {
    const firebaseUserId = await verifyClient(req.query.idToken);
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    const scopes = ["https://www.googleapis.com/auth/contacts.readonly"];
    const oauth2Client = getOauth2Client();
    const url = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: "offline",
      // If you only need one scope you can pass it as a string
      scope: scopes,
    });

    res.redirect(url);
  })
);

router.post(
  "/founderphonehelp",
  [],
  asyncHandler(async (req, res, next) => {
    console.log("Received slash command");
    let teamId = req.body.team_id;
    let client = await Client.findOne({ "slack.teamId": teamId });

    if (client) {
      let helpMessage =
        "Hi! I'm FounderPhone bot. Every time one of your customers texts " +
        parsePhoneNumberFromString(client.twilioPhoneNumber).formatNational() +
        ", I'll create a new channel and send you their messages. You can respond to them by typing @founderphone followed by your message. If you want to initiate a first text with a customer, simply create a new channel for them and type `/founderphonetext <their_phone_number>` followed by your message. If you have more questions, just check out https://help.founderphone.com";
      return res.status(200).send(helpMessage);
    }

    return res
      .status(200)
      .send(
        "Doesn't look like FounderPhone is setup with this Slack. " +
          HELP_CENTER_MESSAGE
      );
  })
);

router.post(
  "/creategoogleaccesstoken",
  [body("code").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    const oauth2Client = getOauth2Client();
    const { tokens } = await oauth2Client.getToken(req.body.code);
    oauth2Client.setCredentials(tokens);

    client.google.accessToken = tokens.access_token;
    await client.save();

    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.refresh_token) {
        oauth2Client.setCredentials({
          refresh_token: tokens.refresh_token,
        });
        client.google.accessToken = tokens.refresh_token;
        await client.save();
      }
    });

    let connections = await getGoogleContacts(oauth2Client);

    // For each phone number, store a corresponding name. If there are duplicates, store the latest name
    for (let person of connections) {
      if (!person.phoneNumbers) {
        continue;
      }

      for (let phoneNumber of person.phoneNumbers) {
        try {
          // Ignore record if no phone number available
          if (!phoneNumber.canonicalForm) {
            continue;
          }

          let parsedNumber = parsePhoneNumberFromString(
            formatPhoneNumber(phoneNumber.canonicalForm)
          );

          // Ignore record if no phone number available
          if (parsedNumber.number.trim().length === 0) {
            continue;
          }

          // Ignore record if no name available
          if (!person.names || !person.names[0].givenName) {
            continue;
          }

          let number = parsedNumber.number;

          let company = "";
          if (person.organizations && person.organizations[0].name) {
            company = person.organizations[0].name;
          }

          let email = "";
          if (person.emailAddresses && person.emailAddresses[0].value) {
            email = person.emailAddresses[0].value;
          }

          let contact = await Contact.findOne({
            client: client._id,
            phoneNumber: number,
          });

          if (!contact) {
            contact = new Contact({
              client: client._id,
              phoneNumber: number,
              firstName: person.names[0].givenName,
              lastName: person.names[0].familyName,
              company: company,
              email: email,
            });
          } else {
            contact.firstName = person.names[0].givenName;
            contact.lastName = person.names[0].familyName;
          }
          await contact.save();
        } catch (err) {
          console.log(err);
        }
      }
    }

    renameChannelsToContactNames(client);

    res.status(200).send();
  })
);

router.post(
  "/founderphonetext",
  [],
  asyncHandler(async (req, res, next) => {
    let teamId = req.body.team_id;
    let channelId = req.body.channel_id;

    let client = await Client.findOne({ "slack.teamId": teamId });

    if (!client) {
      return res
        .status(200)
        .send(
          "*From FounderPhone*: Doesn't look like FounderPhone recognizes this Slack. " +
            HELP_CENTER_MESSAGE
        );
    }

    if (client.billingDetails.currentPlan === planTypes.NOT_PAID) {
      // Client has not paid us so send a response to subscribe
      return res.status(200).send(NOT_SUBSCRIBED_MESSAGE);
    }

    let phoneNumber = "";
    let message = "";

    if (!req.body.text) {
      return res
        .status(200)
        .send(
          "*From FounderPhone*: We need a phone number and message. Try using it like this: `/founderphonetext +15106302297 Hi there!` except with the number you want to text"
        );
    }

    let messageParts = req.body.text.trim().split(" ");
    if (messageParts.length <= 1) {
      return res
        .status(200)
        .send(
          "*From FounderPhone*: We need a phone number and message. Try using it like this: `/founderphonetext +15106302297 Hi there!` except with the number you want to text"
        );
    }

    if (req.body.channel_name === "directmessage") {
      return res
        .status(200)
        .send(
          "*From FounderPhone*: You can only use this command in a channel"
        );
    }

    phoneNumber = messageParts[0];
    message = req.body.text.substring(phoneNumber.length + 1);
    phoneNumber = formatPhoneNumber(phoneNumber);

    let parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber);

    if (
      client.slack.messageFormat === slackMessageFormat.THREAD &&
      channelId !== client.slack.defaultChannelId
    ) {
      return res
        .status(200)
        .send(
          `*From FounderPhone*: You've selected thread-first messaging in your settings. Please start a message in the default channel you selected using /founderphonetext`
        );
    }

    if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
      return res
        .status(200)
        .send(
          "*From FounderPhone*: The phone number you entered doesn't seem valid. Try using this format 5106302297"
        );
    }

    if (!message) {
      return res
        .status(200)
        .send("*From FounderPhone*: We can't send a blank message");
    }

    phoneNumber = parsedPhoneNumber.number;

    let channelName = phoneNumber.replace("+", "");
    channelName = generateSlackChannelName(channelName);

    const THREAD_MESSAGE =
      "You can just responed to this thread and use `@founderphone` to text them.";
    const CHANNEL_MESSAGE =
      "Connected this channel to their number. You can just use `@founderphone` from now in this channel to text them.";

    await inviteBotUserToChannel(channelId, client.slack.accessToken);

    let response = await Slack.chat.postMessage({
      channel: channelId,
      token: client.slack.accessToken,
      text:
        `*From FounderPhone:* Sent ${phoneNumber}: '${message}'.` +
        (client.slack.messageFormat === slackMessageFormat.CHANNEL
          ? " " + CHANNEL_MESSAGE
          : ""),
    });

    if (client.slack.messageFormat === slackMessageFormat.THREAD) {
      await Slack.chat.postMessage({
        channel: channelId,
        token: client.slack.accessToken,
        thread_ts: response.ts,
        text: THREAD_MESSAGE,
      });
    }

    // Map this phone number to this channel
    let phoneMapping = await PhoneMapping.findOne({
      client: client._id,
      userPhoneNumber: phoneNumber,
    });

    if (client.slack.messageFormat === slackMessageFormat.CHANNEL) {
      // Create one if it doesn't exist
      let channelName = phoneNumber.replace("+", "");
      channelName = generateSlackChannelName(channelName);

      if (!phoneMapping) {
        phoneMapping = new PhoneMapping({
          channelId: channelId,
          client: client._id,
          userPhoneNumber: phoneNumber,
          channelName: channelName,
        });
      } else {
        // or update existing mapping
        phoneMapping.channelId = channelId;
      }
    } else {
      // Create one if it doesn't exist
      if (!phoneMapping) {
        phoneMapping = new PhoneMapping({
          userPhoneNumber: userPhoneNumber,
          messageId: response.ts,
          defaultChannelId: client.slack.defaultChannelId,
        });
      } else {
        // or update existing mapping
        phoneMapping.messageId = response.ts;
        phoneMapping.defaultChannelId = client.slack.defaultChannelId;
      }
    }

    await phoneMapping.save();

    sendSMSFromSlack(
      client.twilioPhoneNumber,
      phoneNumber,
      message,
      req.body.response_url,
      client.slack.messageFormat === slackMessageFormat.CHANNEL
    );

    callWebhook(client._id, "SMS", {
      body: message,
      from: client.twilioPhoneNumber,
      to: phoneNumber,
    });

    return res.status(200).send();
  })
);

router.post(
  "/createcontactsfromcsv",
  [],
  asyncHandler(async (req, res, next) => {
    const firebaseUserId = await verifyClient(req.body.idToken);
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    if (req.files.file.mimetype === "text/csv") {
      const contacts = await csvtojsonV2().fromString(
        req.files.file.data.toString()
      );

      for (let contact of contacts) {
        let phoneNumbers = getPhoneNumbersFromCsvContact(contact, "phone");
        for (let phoneNumber of phoneNumbers) {
          let contactCheck = await Contact.findOne({
            client: client._id,
            phoneNumber: phoneNumber,
          });

          if (!contactCheck) {
            contactCheck = new Contact({
              client: client._id,
              phoneNumber: phoneNumber,
            });
          }

          if (contact.hasOwnProperty("Name")) {
            let name = parseFullName(contact["Name"]);
            contactCheck.firstName = name.first;
            contactCheck.lastName = name.last;
          } else {
            contactCheck.firstName = contact["First Name"];
            contactCheck.lastName = contact["Last Name"];
          }

          let organization = getOrganizationFromCSV(contact);
          if (organization) contactCheck.company = organization;

          let email = getEmailFromCSV(contact);
          if (email) contactCheck.email = email;

          if (contactCheck.firstName) {
            await contactCheck.save();
          }
        }
      }
    } else if (
      req.files.file.mimetype === "text/directory" ||
      req.files.file.mimetype === "text/vcard"
    ) {
      let vcards = await vcardParser.parseVcardStringSync(
        req.files.file.data.toString()
      );
      for (let vcard of vcards) {
        let phoneNumbers = getPhoneNumbersFromVCF(vcard);
        let emailAndCompany = getEmailAndOrganizationFromVCF(vcard);
        for (let phoneNumber of phoneNumbers) {
          let contactCheck = await Contact.findOne({
            client: client._id,
            phoneNumber: phoneNumber,
          });
          let name = parseFullName(vcard.fullname);
          if (!contactCheck) {
            contactCheck = new Contact({
              client: client._id,
              phoneNumber: phoneNumber,
              firstName: name.first,
              lastName: name.last,
              email: emailAndCompany.email,
              company: emailAndCompany.org,
            });
          }
          if (contactCheck.firstName) await contactCheck.save();
        }
      }
    }
    await renameChannelsToContactNames(client);
    return res.status(200).send();
  })
);

// Hubspot related API and calls
router.get(
  "/connecttohubspot",
  [],
  asyncHandler(async (req, res, next) => {
    const firebaseUserId = await verifyClient(req.query.idToken);
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    let authorizationUrl = getHubSpotAuthorizationUrl();
    res.redirect(authorizationUrl);
  })
);

router.post(
  "/slackinteraction",
  [],
  asyncHandler(async (req, res, next) => {
    if (req.body.ssl_check) {
      return res.status(200).send();
    }

    let event = JSON.parse(req.body.payload);
    let teamId = event.team.id;
    let client = await Client.findOne({ "slack.teamId": teamId });

    if (!client)
      sendResponseToSlack(
        event.response_url,
        "Doesn't look like we're setup with this Slack. " + HELP_CENTER_MESSAGE
      );

    if (event.type === "block_actions") {
      let action = event.actions[0];
      // If accept call was pressed
      if (action.type === "button" && action.text.text === ANSWER_CALL) {
        let callSid = action.value;
        let triggerId = event.trigger_id;

        let callInProgress = await checkIfCallIsInProgress(callSid);

        mixpanel.track("forwarded call accept pressed", {
          distinct_id: client.email,
          clientPhone: client.twilioPhoneNumber,
        });

        if (!callInProgress) {
          sendResponseToSlack(event.response_url, "The call ended");
          return res.status(200).send();
        }

        sendSlackPhoneNumberModal(callSid, triggerId, client.slack.accessToken);
      }
    } else if (event.type === "view_submission") {
      // We sent the call sid in private_metadata when opening the phone number modal. Retrieving it here
      let callSid = event.view.private_metadata;

      // This condition is required mainly because we are showing two models. First modal is for
      // entering phone number and second model is when the slack user enters the number and hits
      // the redirect button and the call was completed by the customer. So it shows a empty model
      // which says call is completed with Okay button. When okay is clicked it will hit here again.
      // and the below condition will fail and do nothing.
      if (callSid) {
        let phoneNumber =
          event.view.state.values.phonenumberblock.forwarded_number.value;
        let parsedPhoneNumber = parsePhoneNumberFromString(
          formatPhoneNumber(phoneNumber)
        );

        if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
          mixpanel.track("entered incorrect phone number for redirect", {
            distinct_id: client.email,
            clientPhone: client.twilioPhoneNumber,
          });

          let response = {
            response_action: "errors",
            errors: {
              phonenumberblock:
                "Please enter a valid phone number to redirect the call",
            },
          };
          return res.status(200).send(response);
        }

        let callInProgress = await checkIfCallIsInProgress(callSid);

        if (!callInProgress) {
          return res.status(200).send();
        }

        let callAction = await CallAction.findOne({
          client: client._id,
          callSid: callSid,
        });

        callAction.callRedirected = true;
        await callAction.save();

        redirectCall(callSid, phoneNumber);

        mixpanel.track("user in slack accepted call", {
          distinct_id: client.email,
          clientPhone: client.twilioPhoneNumber,
        });
      }
    } else if (event.type === "view_closed") {
      console.log("View closed");
    } else {
      console.log("We can't recognize this Slack interaction");
    }
    return res.status(200).send();
  })
);

router.post(
  "/createaccesstokenfromhubspot",
  [body("code").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    let accessTokenResponse = await getAccessToken(req.body.code);
    if (!accessTokenResponse.success) {
      return res.status(400).send(accessTokenResponse.error);
    }

    client.hubspot.accessToken = accessTokenResponse.accessToken;
    client.hubspot.refreshToken = accessTokenResponse.refreshToken;

    await client.save();

    await syncContactsFromHubSpot(client);
    renameChannelsToContactNames(client);

    return res.status(200).send();
  })
);

router.post(
  "/createprivatechannelslack",
  [body("createPrivateChannel").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    client.slack.createPrivateChannel = req.body.createPrivateChannel;
    await client.save();

    return res
      .status(200)
      .send({ createPrivateChannel: client.slack.createPrivateChannel });
  })
);

router.post(
  "/sendintromessage",
  [
    body("introMessage").not().isEmpty(),
    body("contactsToSend").not().isEmpty(),
  ],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });

    if (!client) {
      return res.status(404).send("Client not found");
    }

    let contactsToSend = req.body.contactsToSend;
    if (contactsToSend.length === 0) {
      return res.status(400).send("No contacts selected");
    }

    try {
      let contacts = await Contact.find()
        .where("_id")
        .in(contactsToSend)
        .exec();

      for (let contact of contacts) {
        let introMessage = req.body.introMessage;
        introMessage = introMessage.replace(/{firstname}/g, contact.firstName);
        introMessage = introMessage.replace(/{lastname}/g, contact.lastName);
        introMessage = introMessage.replace(
          /{company}/g,
          contact.company ? contact.company : ""
        );
        sendSMSAsync(
          client.twilioPhoneNumber,
          contact.phoneNumber,
          introMessage
        );

        callWebhook(client._id, "SMS", {
          body: introMessage,
          from: client.twilioPhoneNumber,
          to: contact.phoneNumber,
        });
      }
      return res.status(200).send({
        message:
          "Your texts are being sent to " + contacts.length + " contacts",
      });
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
      return res
        .status(400)
        .send("Unable to send your messages. " + CONTACT_MESSAGE);
    }
  })
);

router.post(
  "/getcontacts",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    let query = {
      $and: [
        {
          $or: [
            {
              firstName: {
                $regex: ".*" + req.body.searchQuery + ".*",
                $options: "-i",
              },
            },
            {
              lastName: {
                $regex: ".*" + req.body.searchQuery + ".*",
                $options: "-i",
              },
            },
            { phoneNumber: { $regex: ".*" + req.body.searchQuery + ".*" } },
          ],
        },
        { client: client._id },
      ],
    };

    let contacts = await Contact.find(query, null, { sort: { name: "asc" } });

    return res.status(200).send(contacts);
  })
);

router.post(
  "/getcontactsforlogs",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    let phoneMappings = await Message.aggregate([
      { $match: { client: client._id } },
      { $sort: { createdOn: -1 } },
      {
        $group: {
          _id: "$fromPhoneMapping",
          createdOn: { $first: "$createdOn" },
        },
      },
    ]);

    phoneMappings.sort(custom_sort);

    let phoneMappingsResult = [];

    for (let id of phoneMappings) {
      let phonemapping = await PhoneMapping.findById(id._id);
      if (
        phonemapping &&
        phonemapping.userPhoneNumber.includes(req.body.searchQuery)
      ) {
        let contact = await Contact.findOne({
          client: client._id,
          phoneNumber: phonemapping.userPhoneNumber,
        });

        let contactJson = {
          phoneMappingId: phonemapping._id,
          contactName: contact
            ? contact.firstName + " " + contact.lastName
            : phonemapping.userPhoneNumber,
          contact: contact,
        };
        phoneMappingsResult.push(contactJson);
      }
    }

    return res.status(200).send(phoneMappingsResult);
  })
);

router.post(
  "/getlogs",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    let query = {
      $and: [
        {
          $or: [
            {
              fromPhoneMapping: req.body.id,
            },
            {
              toPhoneMapping: req.body.id,
            },
          ],
        },
        { client: client._id },
      ],
    };

    let messages = await Message.find(query).sort({ createdOn: "-1" });

    return res.status(200).send(messages);
  })
);

router.post(
  "/savecampaigntemplate",
  [body("templateMessage").not().isEmpty()],
  async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }
    let isExist = await MessageTemplate.findOne({
      templateName: req.body.templateName,
      client: client._id,
    });

    if (isExist) {
      return res.status(400).send("Template name already exists");
    }

    let messageTemplate = new MessageTemplate({
      client: client._id,
      templateMessage: req.body.templateMessage,
      templateName: req.body.templateName,
    });

    await messageTemplate.save();

    return res.status(200).send();
  }
);

router.post(
  "/getslackchannels",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }
    if (!client.slack || !client.slack.accessToken) {
      return res
        .status(400)
        .send("Slack is not configured. Please configure slack");
    }

    let response = await getSlackChannelList(client.slack.accessToken);

    if (!response.success) {
      return res
        .status(400)
        .send(
          "There was some problem in getting the channel list. Please contact support@founderphone.com"
        );
    }

    return res.status(200).send(response.channelList);
  })
);

router.post(
  "/savecontact",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    let contact = await Contact.findOne({
      client: client._id,
      phoneNumber: req.body.phoneNumber,
    });

    if (contact) {
      res.status(400).send("contact exists");
    }

    contact = new Contact({
      client: client._id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      company: req.body.company,
      accountManager: req.body.accountManager || "",
    });

    await contact.save();

    return res.status(200).send();
  })
);

router.post(
  "/googlesavecontact",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }

    console.log(req.body, "backendgooglesavecontact");

    let client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    let googlecontact;
    for (var i = 0; i < req.body.contacts.length; i++) {
      let googlecontactNumber = await Contact.findOne({
        phoneNumber: req.body.contacts[i].phoneNumber,
        client: client._id,
      });
      if (!googlecontactNumber) {
        googlecontact = new Contact({
          firstName: req.body.contacts[i].firstName,
          lastName: req.body.contacts[i].lastName,
          phoneNumber: req.body.contacts[i].phoneNumber,
          email: req.body.contacts[i].email,
          client: client._id,
        });
        await googlecontact.save();
      }
    }
    return res.status(200).send();
  })
);

router.post(
  "/deletecontact",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    let contact = await Contact.findById(req.body.id);
    await contact.remove();

    return res.status(200).send();
  })
);

router.post(
  "/reply",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({
      firebaseUserId: firebaseUserId,
    });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    let message = req.body.message;
    let phoneMapping = await PhoneMapping.findById(req.body.id);

    let channel = phoneMapping.channelId;

    let files = null;

    if (client.billingDetails.currentPlan === planTypes.NOT_PAID) {
      sendMessageToSlack(
        channel,
        client.slack.accessToken,
        NOT_SUBSCRIBED_MESSAGE
      );
      return;
    }

    let contact = await Contact.findOne({
      client: client._id,
      phoneNumber: phoneMapping.userPhoneNumber,
    });
    let channelName = "";
    channelName = phoneMapping.userPhoneNumber.replace("+", "");
    channelName = generateSlackChannelName(channelName);

    if (contact) {
      channelName = await getNamedChannel(
        contact.firstName + " " + contact.lastName,
        contact.company,
        client._id
      );
    }
    channelName = channelName.toLowerCase();
    let response = await checkChannelExistsInWorkspace(
      client.slack.accessToken,
      channel
    );

    if (!response.channelWorks) {
      createChannelAndInviteDefaultRespondants(
        client,
        phoneMapping,
        channelName,
        phoneMapping.userPhoneNumber
      );
    }

    await reply(client, message, files, channel);
    return res.status(200).send();
  })
);

router.post(
  "/getallsavedtemplates",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }
    let savedTemplates = await MessageTemplate.find({ client: client._id });
    return res.status(200).send(savedTemplates);
  })
);

router.post(
  "/savechannelid",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    client.slack.defaultChannelId = req.body.channelId;
    await client.save();

    await PhoneMapping.findOneAndDelete({
      client: client._id,
      channelId: req.body.channelId,
    });
    return res.status(200).send();
  })
);

router.post(
  "/deletesavedtemplate",
  [body("templateId").not().isEmpty()],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }
    let messageTemplate = await MessageTemplate.findById(req.body.templateId);
    if (!messageTemplate) {
      return res.status(404).send("template not found");
    }

    if (!messageTemplate.client.equals(client._id)) {
      return res.status(400).send("User doesn't own this template");
    }

    await messageTemplate.remove();
  })
);

router.post(
  "/savemessageformat",
  [],
  asyncHandler(async (req, res, next) => {
    let firebaseUserId;
    try {
      firebaseUserId = await validate(req);
    } catch (error) {
      Sentry.captureException(error);
      return res.status(400).send(error);
    }
    let client = await Client.findOne({ firebaseUserId: firebaseUserId });
    if (!client) {
      return res.status(404).send("Client not found");
    }

    client.slack.messageFormat = req.body.messageFormat;
    await client.save();
    return res.status(200).send();
  })
);

export default router;
