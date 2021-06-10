import Client from "../models/client";
import { planTypes } from "../utils/types";
import { endTrial } from "../controllers/stripeFunctions";

export const JOB_NAME = "END_TRIAL";

export function jobFunction(agenda) {
  agenda.define(JOB_NAME, async (job, done) => {
    var clientId = job.attrs.data.clientId;
    let client = await Client.findById(clientId);
    console.log(`Cancelling trial period for ${clientId}`);
    if (client) {
      if (client.billingDetails.currentPlan === planTypes.TRIAL) {
        await endTrial(client);
      } else {
        console.log("The user has moved to paid plans.");
      }
    } else {
      console.log(`Unable to find client with id ${clientId} to change jobs`);
    }

    done();
  });
}
