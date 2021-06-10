import HubSpot from "hubspot";
import Contact from "../models/contact";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { formatPhoneNumber } from "../utils/phone";
import * as Sentry from "@sentry/node";
import { sentryException } from "../utils/customSentry";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
let REDIRECT_URL = process.env.SERVER_URL;

REDIRECT_URL += "/hubspotcallback";

export function getHubSpotAuthorizationUrl() {
  const params = {
    client_id: HUBSPOT_CLIENT_ID,
    scope: "contacts",
    redirect_uri: REDIRECT_URL,
  };

  const hubspot = new HubSpot({
    apiKey: "",
    checkLimit: false,
  });

  const AUTH_URI = hubspot.oauth.getAuthorizationUrl(params);
  return AUTH_URI;
}

export async function getAccessToken(code) {
  const params = {
    code: code, // the code you received from the oauth flow
    client_id: HUBSPOT_CLIENT_ID,
    client_secret: HUBSPOT_CLIENT_SECRET,
    redirect_uri: REDIRECT_URL,
  };

  const hubspot = new HubSpot(params);

  try {
    let accessTokenResponse = await hubspot.oauth.getAccessToken(params);

    return {
      success: true,
      accessToken: accessTokenResponse.access_token,
      refreshToken: accessTokenResponse.refresh_token,
    };
  } catch (error) {
    console.log(error);
    Sentry.captureException(error);
    return {
      success: false,
      error: "There was a problem connecting with HubSpot. Please try later",
    };
  }
}

export async function syncContactsFromHubSpot(client) {
  const hubspot = new HubSpot({ accessToken: client.hubspot.accessToken });
  try {
    let nextPage = "";
    while (true) {
      let params = {
        count: 100,
        property: ["firstname", "lastname", "company", "phone"],
      };
      if (nextPage) params.vidOffset = nextPage;

      let response = await hubspot.contacts.getAll(params);

      let contacts = [];
      for (let contact of response.contacts) {
        let contactDetails = {};

        contactDetails.firstName = contact.properties.firstname
          ? contact.properties.firstname.value
          : "";

        contactDetails.lastName = contact.properties.lastname
          ? contact.properties.lastname.value
          : "";

        // Ignore record if no first name available
        if (contactDetails.firstName.trim().length === 0) {
          continue;
        }

        contactDetails.phoneNumber = "";
        if (contact.properties.phone) {
          let parsedNumber = parsePhoneNumberFromString(
            formatPhoneNumber(contact.properties.phone.value)
          );

          if (parsedNumber) {
            contactDetails.phoneNumber = parsedNumber.number;
          }
        }

        // Ignore record if no phone number available
        if (contactDetails.phoneNumber.trim().length === 0) {
          continue;
        }

        contactDetails.company = contact.properties.companyname
          ? contact.properties.company.value
          : "";

        let identityProfile = contact["identity-profiles"][0].identities[0];
        if (identityProfile.type !== "EMAIL")
          identityProfile = contact["identity-profiles"][0].identities[1];

        if (identityProfile && identityProfile.value) {
          contactDetails.email = identityProfile.value;
        }
        contacts.push(contactDetails);
      }

      let newContacts = [];
      for (let contactDetails of contacts) {
        if (contactDetails.phoneNumber) {
          let existingContact = await Contact.findOne({
            client: client._id,
            phoneNumber: contactDetails.phoneNumber,
          });

          if (!existingContact) {
            let contact = new Contact({
              email: contactDetails.email,
              company: contactDetails.company,
              firstName: contactDetails.firstName,
              lastName: contactDetails.lastName,
              phoneNumber: contactDetails.phoneNumber,
              client: client._id,
            });
            newContacts.push(contact);
          } else {
            existingContact.email = contactDetails.email;
            existingContact.company = contactDetails.company;
            existingContact.firstName = contactDetails.firstName;
            existingContact.lastName = contactDetails.lastName;
            await existingContact.save();
          }
        }
      }

      if (newContacts.length > 0)
        await Contact.collection.insertMany(newContacts);

      if (response["has-more"]) {
        nextPage = response["vid-offset"];
      } else {
        break;
      }
    }

    return true;
  } catch (error) {
    console.log(error);
    sentryException(error, client.email);
  }
  return false;
}
