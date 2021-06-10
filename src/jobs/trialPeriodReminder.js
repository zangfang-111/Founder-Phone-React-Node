import Client from "../models/client";
import { planTypes } from "../utils/types";
import { sendTrialPeriodEndReminder } from "../controllers/mail";

export const JOB_NAME = "TRIAL_PERIOD_REMINDER";

export function jobFunction(agenda) {
  agenda.define(JOB_NAME, async (job, done) => {
    var clientId = job.attrs.data.clientId;
    let client = await Client.findById(clientId);

    console.log("Sending reminder email about informing trial end");

    if (client.billingDetails.currentPlan === planTypes.TRIAL) {
      console.log("Sent email reminder for trial");
      sendTrialPeriodEndReminder(client.email);
    }

    done();
  });
}
