import Client from "../models/client";
import { planTypes } from "../utils/types";
import { cancelPlan } from "../controllers/stripeFunctions";

export const JOB_NAME = "CHANGE_PLAN";

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

        let response = null;
        if (currentPlan !== selectedPlan) {
          if (selectedPlan === planTypes.NOT_PAID) {
            response = await cancelPlan(client);
          }

          if (response && response.success) {
            console.log(
              `Client id ${client._id} was successfully moved from ${currentPlan} to ${selectedPlan}`
            );
          } else {
            console.log(
              `There was problem in changing plan for client id ${client._id} from ${currentPlan} to ${selectedPlan} because`
            );
            console.log(`${response.error}`);
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
