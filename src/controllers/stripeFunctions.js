import { planTypes } from "../utils/types";
import UserSubscriptionHistory from "../models/usersubscriptionhistory";
import { agenda, JOB_TYPES } from "./agenda";
import moment from "moment";
import Stripe from "stripe";
import { releasePhoneNumber } from "./twilioFunctions";
import * as Sentry from "@sentry/node";
import { sentryException } from "../utils/customSentry";

require("dotenv").config();

let STRIPE_API_KEY = process.env.STRIPE_SECRET_KEY;

let STRIPE_PLAN_SUBSCRIPTION_LIST = process.env.STRIPE_PLAN_SUBSCRIPTION_LIST;

const stripe = Stripe(STRIPE_API_KEY);

export async function movedToPaidPlan(client) {
  let oldBillingDetails = new UserSubscriptionHistory({
    client: client._id,
    plan: client.billingDetails.currentPlan,
    subscribedOn: client.billingDetails.subscribedOn,
  });

  try {
    const subscription = await stripe.subscriptions.create({
      customer: client.stripeCustomerId,
      trial_from_plan: true,
      items: [
        {
          plan: STRIPE_PLAN_SUBSCRIPTION_LIST,
        },
      ],
      expand: ["latest_invoice.payment_intent"],
    });

    if (
      subscription.status === "trialing" ||
      (subscription.status === "active" &&
        subscription.latest_invoice.payment_intent.status === "succeeded")
    ) {
      await oldBillingDetails.save(); // Save the previous plan in history

      client.billingDetails.currentPlan = planTypes.PAID;
      client.billingDetails.subscribedOn = new Date();
      client.billingDetails.subscriptionId = subscription.id;
      client.billingDetails.requestForDowngrade = false;
      client.billingDetails.expirationDate = null;
      client.billingDetails.nextPlan = "";

      await client.save();
      return {
        success: true,
      };
    } else {
      // Handle payment failure and other scenarios
      return {
        success: false,
        error:
          "Initial payment failed please try again or try a different card",
      };
    }
  } catch (error) {
    sentryException(error, client.email);
    return {
      success: false,
      error: handleResponseError(error),
    };
  }
}

export async function createCustomerWallet(user, sourceToken) {
  try {
    const customer = await stripe.customers.create({
      source: sourceToken,
      email: user.email,
    });

    user.stripeCustomerId = customer.id;
    user.save();
    return {
      success: true,
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      success: false,
      error: handleResponseError(error),
    };
  }
}

export async function updateCustomerWallet(stripeCustomerId, sourceToken) {
  try {
    await stripe.customers.update(stripeCustomerId, {
      source: sourceToken,
    });
    return {
      success: true,
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      success: false,
      error: handleResponseError(error),
    };
  }
}

export async function cancelPlan(client) {
  let oldBillingDetails = new UserSubscriptionHistory({
    client: client._id,
    plan: client.billingDetails.currentPlan,
    subscribedOn: client.billingDetails.subscribedOn,
  });

  let currentSubscription = await stripe.subscriptions.retrieve(
    client.billingDetails.subscriptionId
  );

  if (currentSubscription) {
    await stripe.subscriptions.update(client.billingDetails.subscriptionId, {
      cancel_at_period_end: true,
    });

    await oldBillingDetails.save();

    //Reset all the billing details
    client.billingDetails.currentPlan = planTypes.NOT_PAID;
    client.billingDetails.subscribedOn = new Date();
    client.billingDetails.requestForDowngrade = false;
    client.billingDetails.expirationDate = null;
    client.billingDetails.subscriptionId = "";
    client.billingDetails.nextPlan = "";

    await client.save();

    if (client.twilioPhoneNumber) {
      await releasePhoneNumber(client.twilioPhoneNumber);
    }

    return {
      success: true,
    };
  } else {
    return {
      success: false,
      error: "Subscription not found",
    };
  }
}

function handleResponseError(err) {
  // Console messages is only for checking issues related to stripe in case of complaints
  const USER_ERROR_MESSAGE =
    "There was an error with your billing information. Please try again or contact support@founderphone.com";
  switch (err.type) {
    case "StripeCardError":
      return err.message;
    case "StripeRateLimitError":
      console.info("Rate limit error. Unusual activity with api request");
      return USER_ERROR_MESSAGE;
    case "StripeInvalidRequestError":
      console.info("Invalid request");
      return USER_ERROR_MESSAGE;
    case "StripeAPIError":
      console.info("Problem with Stripe API");
      return USER_ERROR_MESSAGE;
    case "StripeConnectionError":
      console.info("Stripe is down");
      return USER_ERROR_MESSAGE;
    case "StripeAuthenticationError":
      console.info("Key used in wrong please check the API Keys");
      return USER_ERROR_MESSAGE;
    default:
      return USER_ERROR_MESSAGE;
  }
}

export async function changePlan(client, selectedPlan) {
  console.log("change plan");

  let currentSubscription = await stripe.subscriptions.retrieve(
    client.billingDetails.subscriptionId
  );

  if (currentSubscription) {
    let currentPlanEndDate = moment
      .unix(currentSubscription.current_period_end)
      .utc();

    currentPlanEndDate.add(-1, "hour");

    if (!client.billingDetails.requestForDowngrade) {
      // create a job
      const data = { clientId: client._id.toString() };
      agenda.schedule(currentPlanEndDate, JOB_TYPES.CHANGE_PLAN, data);
    }

    client.billingDetails.requestForDowngrade = true;
    client.billingDetails.expirationDate = currentPlanEndDate;
    client.billingDetails.nextPlan = selectedPlan;

    await client.save();

    return {
      success: true,
    };
  } else {
    sentryException("Subscription not found", client.email);
    return {
      success: false,
      error: "Subscription not found",
    };
  }
}

export async function startPromo(client, PROMO) {
  client.billingDetails.currentPlan = planTypes.PAID;
  let currentPlanEndDate = moment().add(14, "days").utc();

  if (!client.billingDetails.requestForDowngrade) {
    // create a job
    const data = { clientId: client._id.toString() };
    agenda.schedule(currentPlanEndDate, JOB_TYPES.END_PROMO, data);
  }

  client.billingDetails.requestForDowngrade = true;
  client.billingDetails.expirationDate = currentPlanEndDate;
  client.billingDetails.nextPlan = planTypes.NOT_PAID;

  if (client.billingDetails.promosApplied.indexOf(PROMO) === -1) {
    client.billingDetails.promosApplied.push(PROMO);
  }

  await client.save();
}

export async function cancelPromo(client) {
  let oldBillingDetails = new UserSubscriptionHistory({
    client: client._id,
    plan: client.billingDetails.currentPlan,
    subscribedOn: client.billingDetails.subscribedOn,
  });

  await oldBillingDetails.save();

  //Reset all the billing details
  client.billingDetails.currentPlan = planTypes.NOT_PAID;
  client.billingDetails.subscribedOn = new Date();
  client.billingDetails.requestForDowngrade = false;
  client.billingDetails.expirationDate = null;
  client.billingDetails.subscriptionId = "";
  client.billingDetails.nextPlan = "";

  await client.save();

  if (client.twilioPhoneNumber) {
    await releasePhoneNumber(client.twilioPhoneNumber);
  }
}

export async function endTrial(client) {
  let oldBillingDetails = new UserSubscriptionHistory({
    client: client._id,
    plan: client.billingDetails.currentPlan,
    subscribedOn: client.billingDetails.subscribedOn,
  });

  await oldBillingDetails.save();

  //Reset all the billing details
  client.billingDetails.currentPlan = planTypes.NOT_PAID;
  client.billingDetails.subscribedOn = new Date();
  client.billingDetails.requestForDowngrade = false;
  client.billingDetails.expirationDate = null;
  client.billingDetails.subscriptionId = "";
  client.billingDetails.nextPlan = "";

  await client.save();

  // TODO:: Need to schedule a job after n days to completely remove the account and
  // or mark the account as inactive. And when they login ask them to contact support
  // only if support guy agrees to reactive account we can reactivate and onboard them
  // as paid customers with new number. Also put the number in trial number pool which
  // can be used for others if there is no activity in that number
}
