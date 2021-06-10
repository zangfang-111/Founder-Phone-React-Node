import express from "express";
import { body, query } from "express-validator";
import asyncHandler from "express-async-handler";

import { validateFireBaseIdTokenMiddleware } from "./middlewares";
import { getWebhook, testWebhook, upsertWebhook } from "../controllers/webhook";

var router = express.Router();

router.get(
  "/url",
  [validateFireBaseIdTokenMiddleware],
  asyncHandler(async (req, res) => {
    const webhook = await getWebhook(res.locals.client._id);
    return res.status(200).send(webhook ? webhook.url : "");
  })
);

router.post(
  "/url",
  [validateFireBaseIdTokenMiddleware],
  asyncHandler(async (req, res) => {
    if (!req.body.url || req.body.url.indexOf("http") !== 0) {
      await upsertWebhook(res.locals.client._id, req.body.url, false);
      return res.status(200).send(req.body.url);
    }
    testWebhook(res.locals.client._id, req.body.url)
      .then(async () => {
        const webhook = await upsertWebhook(
          res.locals.client._id,
          req.body.url,
          true
        );
        return res.status(200).send(webhook.url);
      })
      .catch(async () => {
        await upsertWebhook(
          res.locals.client._id,
          req.body.url,
          false
        );
        return res.status(400);
      });
  })
);

export default router;
