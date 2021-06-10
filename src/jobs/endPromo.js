import Client from "../models/client";
import { planTypes } from "../utils/types";
import { cancelPromo } from "../controllers/stripeFunctions";

export const JOB_NAME = "END_PROMO";

export function jobFunction(agenda) {
  agenda.define(JOB_NAME, async (job, done) => {
    var clientId = job.attrs.data.clientId;
    let client = await Client.findById(clientId);
    console.log(`Downgrade plan using job started for ${clientId}`);
    if (client) {
      if (client.billingDetails.requestForDowngrade) {
        let selectedPlan = client.billingDetails.nextPlan;
        let currentPlan = client.billingDetails.currentPlan;

        console.log(
          `Changing plan for ${clientId} From ${currentPlan} to ${selectedPlan}`
        );

        if (currentPlan !== selectedPlan) {
          if (selectedPlan === planTypes.NOT_PAID) {
            await cancelPromo(client);
          }
        }
      } else {
        console.log("There was no request for change plan");
      }
    } else {
      console.log(`Unable to find client with id ${clientId} to change jobs`);
    }

    done();
  });
}
