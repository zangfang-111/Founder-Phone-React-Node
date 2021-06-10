import { validationResult } from "express-validator";
import { verifyClient } from "../controllers/firebaseFunctions";

export const validate = async (req) => {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw errors;
  }

  const idToken = ["GET", "DELETE"].includes(req.method)
    ? req.query.idToken
    : req.body.idToken;

  const firebaseUserId = await verifyClient(idToken);
  if (firebaseUserId === null) {
    throw "Invalid client";
  }

  return firebaseUserId;
};
