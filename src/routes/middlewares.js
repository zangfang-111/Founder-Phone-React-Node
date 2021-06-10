import * as Sentry from "@sentry/node";

import { validate } from "./utils";
import Client from "../models/client";

export const validateFireBaseIdTokenMiddleware = async (req, res, next) => {
  if (["GET", "DELETE"].includes(req.method)) {
    if (!req.query.idToken) {
      return res.status(400).send("Authentication failed");
    }
  } else if (!req.body.idToken) {
    return res.status(400).send("Authentication failed");
  }

  let firebaseUserId;
  try {
    firebaseUserId = await validate(req);
  } catch (error) {
    Sentry.captureException(error);
    return res.status(400).send("Authentication failed");
  }

  const client = await Client.findOne({ firebaseUserId });

  if (!client) {
    return res.status(400).send("Invalid client");
  }

  res.locals.client = client;
  return next();
};
