// a library to wrap and simplify api calls
import apisauce from "apisauce";
import Axios from "axios";
import firebase from "firebase/app";

const SERVER_URL = `${process.env.REACT_APP_SERVER_URL}/api`;

const instance = Axios.create({
  // base URL is read from the "constructor"
  baseURL: SERVER_URL,
  // here are some default headers
  headers: {
    "Cache-Control": "no-cache",
  },
  // 10 second timeout...
  timeout: 10000,
});

export const createApiCall = (endpoint, params, callback) => {
  firebase
    .auth()
    .currentUser.getIdToken(true)
    .then((idToken) => {
      params["idToken"] = idToken;
      instance.post(endpoint, params).then((res) => {
        callback(res);
      });
      console.log("/" + endpoint);
    });
};

export const getFirebaseIdToken = () => {
  return firebase.auth().currentUser.getIdToken(true);
};

export const createApiCallWithFormData = (endpoint, data, callback) => {
  firebase
    .auth()
    .currentUser.getIdToken(true)
    .then((idToken) => {
      data.append("idToken", idToken);
      instance.post(endpoint, data).then((res) => {
        callback(res);
      });
      console.log("/" + endpoint);
    });
};

// export const createUnAuthenticatedCall = (endpoint, params, callback) => {
//   instance.post(endpoint, params).then(res => {
//     callback(res);
//   });
//   console.log("/" + endpoint);
// };

export const registerUser = (callback) => {
  createApiCall("registerclient", {}, callback);
};

export const saveCard = (stripeToken, callback) => {
  createApiCall(
    "savecard",
    {
      stripeToken: stripeToken,
    },
    callback
  );
};

export const applyPromo = (promo, callback) => {
  createApiCall("applypromo", { promo }, callback);
};

export const subscribetoplan = (callback) => {
  createApiCall("subscribetoplan", {}, callback);
};

export const unsubscribetoplan = (callback) => {
  createApiCall("unsubscribetoplan", {}, callback);
};

export const getClientAccount = (callback) => {
  createApiCall("clientaccount", {}, callback);
};

export const createSlackAccessToken = (code, clientId, callback) => {
  createApiCall("createslackaccesstoken", { code, clientId }, callback);
};

export const createGoogleAccessToken = (code, callback) => {
  createApiCall("creategoogleaccesstoken", { code }, callback);
};

export const connectToSlack = () => {
  firebase
    .auth()
    .currentUser.getIdToken(true)
    .then((idToken) => {
      window.open(SERVER_URL + "/connecttoslack?idToken=" + idToken, "_self");
    });
};

export const connectToGoogle = () => {
  firebase
    .auth()
    .currentUser.getIdToken(true)
    .then((idToken) => {
      window.open(SERVER_URL + "/connecttogoogle?idToken=" + idToken, "_self");
    });
};

export const addDefaultRespondents = (defaultRespondents, callback) => {
  createApiCall("adddefaultrespondent", { defaultRespondents }, callback);
};

export const addCallRedirection = (
  callRedirectNumber,
  forwardText,
  forwardToSlackFirst,
  callback
) => {
  createApiCall(
    "addcallredirection",
    { callRedirectNumber, forwardText, forwardToSlackFirst },
    callback
  );
};

export const getDefaultRespondents = (callback) => {
  createApiCall("getdefaultrespondents", {}, callback);
};

export const getSlackUsers = () => {
  return firebase
    .auth()
    .currentUser.getIdToken(true)
    .then((idToken) => {
      return instance.get("slackusers", {
        params: {
          idToken,
        }
      });
    });
};

export const createContactsFromCsv = (file, callback) => {
  let data = new FormData();
  data.append("file", file);
  createApiCallWithFormData("createcontactsfromcsv", data, callback);
};

export const connectToHubSpot = () => {
  firebase
    .auth()
    .currentUser.getIdToken(true)
    .then((idToken) => {
      window.open(SERVER_URL + "/connecttohubspot?idToken=" + idToken, "_self");
    });
};

export const createHubSpotAccessToken = (code, callback) => {
  createApiCall("createaccesstokenfromhubspot", { code }, callback);
};

export const createPrivateChannelInSlack = (createPrivateChannel, callback) => {
  createApiCall(
    "createprivatechannelslack",
    { createPrivateChannel },
    callback
  );
};

export const getContacts = (query, callback) => {
  createApiCall("getcontacts", { searchQuery: query }, callback);
};

export const getContactsForLogs = (query, callback) => {
  createApiCall("getcontactsforlogs", { searchQuery: query }, callback);
};

export const getLogs = (id, callback) => {
  createApiCall("getlogs", { id }, callback);
};

export const sendIntroMessage = (introMessage, contactsToSend, callback) => {
  createApiCall("sendintromessage", { introMessage, contactsToSend }, callback);
};

export const saveContact = (
  firstName,
  lastName,
  phoneNumber,
  email,
  company,
  accountManager,
  callback
) => {
  createApiCall(
    "savecontact",
    {
      firstName,
      lastName,
      phoneNumber,
      email,
      company,
      accountManager,
    },
    callback
  );
};

export const googleSaveContact = (body, callback) => {
  createApiCall("googlesavecontact", body, callback);
};

export const saveCampaignTemplate = (
  templateName,
  templateMessage,
  callback
) => {
  createApiCall(
    "savecampaigntemplate",
    { templateName, templateMessage },
    callback
  );
};

export const deleteContact = (id, callback) => {
  createApiCall("deletecontact", { id }, callback);
};

export const replyToMessage = (id, message, callback) => {
  createApiCall("reply", { id, message }, callback);
};

export const getAllSavedTemplates = (callback) => {
  createApiCall("getallsavedtemplates", {}, callback);
};

export const deleteSavedTemplate = (templateId, callback) => {
  createApiCall("deletesavedtemplate", { templateId }, callback);
};

export const getSlackChannels = (callback) => {
  createApiCall("getslackchannels", {}, callback);
};

export const saveChannelId = (channelId, callback) => {
  createApiCall("savechannelid", { channelId }, callback);
};

export const saveMessageFormat = (messageFormat, callback) => {
  createApiCall("savemessageformat", { messageFormat }, callback);
};

export const fetchWebhookUrl = () => {
  return getFirebaseIdToken().then((idToken) => {
    return instance.get("/webhooks/url", {
      params: {
        idToken,
      }
    });
  });
};

export const updateWebhook = (url) => {
  return getFirebaseIdToken().then((idToken) => {
    return instance.post(`/webhooks/url`, {
      idToken,
      url,
    });
  });
};
