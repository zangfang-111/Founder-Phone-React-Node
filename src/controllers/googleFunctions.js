import { google } from "googleapis";

let REDIRECT_URL = process.env.SERVER_URL;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET,
  REDIRECT_URL + "/googlecallback"
);

export function getOauth2Client() {
  return oauth2Client;
}

export async function getGoogleContacts(oauth2Client) {
  const service = google.people({ version: "v1", auth: oauth2Client });

  let response = await service.people.connections.list({
    resourceName: "people/me",
    personFields: "names,phoneNumbers",
    pageSize: 2000,
  });

  return response.data.connections;
}
