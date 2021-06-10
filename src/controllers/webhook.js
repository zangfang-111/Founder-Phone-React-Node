import axios from "axios";
import * as Sentry from "@sentry/node";

import { mixpanel } from "../app";
import { Webhook, WebhookLog } from "../models/webhook";

export const testWebhook = async (clientId, url) => {
  const payload = {
    type: "TEST",
  };

  return callWebhookUrlAndLog(clientId, url, payload);
};

const callWebhookUrlAndLog = async (clientId, url, payload) => {
  return axios
    .post(url, payload)
    .then((response) => {

      Sentry.captureMessage("Webhook call successful");
      mixpanel.track("Webhook call successful");

      return WebhookLog.create({
        client: clientId,
        requestUrl: url,
        requestPayload: payload,
        responseStatus: response.status,
        responseData: response.data,
      });
    })
    .catch((error) => {
      Sentry.captureMessage("Webhook call failed");
      mixpanel.track("Webhook call failed");

      Sentry.captureMessage(error);
      return WebhookLog.create({
        client: clientId,
        requestUrl: url,
        requestPayload: payload,
        responseStatus: error.response.status,
        responseData: error.response.data,
      });
    });
}

export const callWebhook = async (clientId, type, payload) => {
  const webhook = await getWebhook(clientId);
  if (!webhook || !webhook.url) {
    console.log("Webhook not found");
    return Promise.resolve();
  }

  const newPayload = {
    ...payload,
    type,
  };

  return callWebhookUrlAndLog(clientId, webhook.url, newPayload);
};

export const getWebhook = async (clientId) => {
  return Webhook.findOne({ client: clientId, isActive: true }, null);
};

export const upsertWebhook = async (clientId, url, isActive) => {
  let webhook = await getWebhook(clientId);
  if (webhook) {
    webhook.url = url;
    webhook.isActive = isActive;

    Sentry.captureMessage("Webhook updated");
    mixpanel.track("Webhook updated");
  } else {
    webhook = new Webhook({
      client: clientId,
      url,
      isActive,
    });

    Sentry.captureMessage("Webhook created");
    mixpanel.track("Webhook created");

  }
  await webhook.save();
  return webhook;
};
