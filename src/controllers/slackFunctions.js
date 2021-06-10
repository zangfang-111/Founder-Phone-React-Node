import Slack from "slack";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import axios from "axios";
import Contact from "../models/contact";
import PhoneMapping from "../models/phonemapping";
import * as Sentry from "@sentry/node";
import {
  getPhoneNumberModal,
  getCallCompleteModal,
} from "../utils/slackBlocks";
import { sentryException } from "../utils/customSentry";
import { sendSlackIncorrectConfigurationEmail } from "./mail";
import { generateSlackChannelName } from "../utils/slack";

let SERVER_URL = process.env.SERVER_URL;

const SLACK_REDIRECT_URL = SERVER_URL + "/slackcallback";

export function getSlackRedirectUrl() {
  return SLACK_REDIRECT_URL;
}

export async function inviteUserToChannel(email, channelId, accessToken) {
  try {
    let response = await Slack.users.lookupByEmail({
      email: email,
      token: accessToken,
    });
    if (response.ok) {
      let userId = response.user.id;
      let inviteUser = await Slack.conversations.invite({
        channel: channelId,
        users: userId,
        token: accessToken,
      });
      if (inviteUser.ok) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          errorMessage: "Unable to invite the user to channel",
        };
      }
    }
    return {
      success: false,
      errorMessage: "Error in retrieving user from slack",
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      success: false,
      errorMessage: "user not found in slack",
    };
  }
}

export async function joinChannel(accessToken, channelId) {
  await Slack.conversations.join({ token: accessToken, channel: channelId });
}

export async function createNewSlackChannel(
  clientEmail,
  channelName,
  accessToken,
  phoneNumber,
  createPrivateChannel = false
) {
  let channelId;

  try {
    let response = await Slack.conversations.create({
      name: channelName,
      token: accessToken,
      is_private: createPrivateChannel,
    });

    if (response.ok) {
      channelId = response.channel.id;
    }
  } catch (error) {
    console.log(error.message);
    Sentry.captureException(error);

    if (error.message === "restricted_action") {
      console.log("Slack workspace permissions won't allow channel creation");
      sentryException(error, clientEmail);
      sendSlackIncorrectConfigurationEmail(clientEmail);
      return;
    } else if (error.message === "name_taken") {
      console.log("Name taken. Find channel with existing name");

      try {
        console.log("hello");
        let listResponse = await Slack.conversations.list({
          token: accessToken,
          limit: 1000,
        });

        let channel = listResponse.channels.find((channel) => {
          return channel.name === channelName;
        });

        if (channel) {
          channelId = channel.id;
        } else {
          let count = 1;
          let foundAChannelName = false;

          while (!foundAChannelName && count < 100) {
            try {
              let secondTryResponse = await Slack.conversations.create({
                name: channelName + "_" + count,
                token: accessToken,
                is_private: createPrivateChannel,
              });

              foundAChannelName = true;
              channelId = secondTryResponse.channel.id;
            } catch (error) {
              count++;
            }
          }
        }
      } catch (error) {
        console.log(error);
        Sentry.captureException(error);
      }

      // Join the channel
      try {
        await Slack.conversations.join({
          token: accessToken,
          channel: channelId,
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  let formattedNumber = parsePhoneNumberFromString(
    phoneNumber
  ).formatNational();

  await Slack.chat.postMessage({
    channel: channelId,
    token: accessToken,
    text:
      "Hi there! I'm the FounderPhone bot. I'll send texts from " +
      formattedNumber +
      " to this channel, " +
      channelName +
      ". Feel free to rename the channel.",
  });

  return channelId;
}

export async function listSlackUsers(accessToken) {
  try {
    let response = await Slack.users.list({
      token: accessToken,
    });
    if (response.ok) {
      return {
        success: true,
        users: response.members,
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    console.log(error);
    return {
      success: false,
      errorMessage: "Call failed, retry",
    };
  }
}

export async function checkUserExistsInSlack(email, accessToken) {
  try {
    let response = await Slack.users.lookupByEmail({
      email: email,
      token: accessToken,
    });
    if (response.ok) {
      return {
        success: true,
        displayName: response.user.id,
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    console.log(error);
    return {
      success: false,
      errorMessage: "User not found in Slack",
    };
  }
}

export async function sendSlackPhoneNumberModal(
  callSid,
  triggerId,
  accessToken
) {
  let phoneNumberModalBlock = getPhoneNumberModal(callSid);

  let data = {
    token: accessToken,
    trigger_id: triggerId,
    view: phoneNumberModalBlock,
  };

  try {
    await axios.post("https://slack.com/api/views.open", data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.log(error);
    Sentry.captureException(error);
  }
}

export async function sendResponseToSlack(response_url, text) {
  try {
    await axios.post(
      response_url,
      {
        text: text,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.log(error);
    Sentry.captureException(error);
  }
}

export async function sendMessageToSlack(channelId, accessToken, message) {
  try {
    await Slack.chat.postMessage({
      channel: channelId,
      token: accessToken,
      text: message,
    });
  } catch (error) {
    console.log(error);
    Sentry.captureException(error);
  }
}

export async function convertToAtMentions(userEmails, accessToken) {
  let message = "";

  for (let userEmail of userEmails) {
    let user = await checkUserExistsInSlack(userEmail, accessToken);

    let displayName = "<@" + user.displayName + "> ";
    message = message.concat(displayName);
  }

  return message;
}

export function getCallCompletedBlockResponse() {
  return {
    response_action: "update",
    view: getCallCompleteModal(),
  };
}

export async function renameChannel(
  accessToken,
  channelId,
  newName,
  phoneNumber
) {
  try {
    await Slack.conversations.rename({
      token: accessToken,
      channel: channelId,
      name: newName,
    });
  } catch (error) {
    console.log(error);
    await Slack.conversations.rename({
      token: accessToken,
      channel: channelId,
      name: newName + "_" + phoneNumber.slice(-4),
    });
  }
}

export async function renameChannelsToContactNames(client) {
  let mappingsToRename = await PhoneMapping.find({
    client: client._id,
    channelName: { $regex: /^fp_/ },
  });

  mappingsToRename.forEach(async (mapping) => {
    let contact = await Contact.findOne({
      client: client._id,
      phoneNumber: mapping.userPhoneNumber,
    });

    if (!contact) {
      return;
    }

    let cleanedPhoneNumber = mapping.userPhoneNumber.substr(1); // remove the +
    let originalChannelName = generateSlackChannelName(cleanedPhoneNumber);

    if (mapping.channelName === originalChannelName) {
      let newChannelName = await getNamedChannel(
        contact.firstName,
        contact.lastName,
        contact.company,
        client._id
      );

      await renameChannel(
        client.slack.accessToken,
        mapping.channelId,
        newChannelName,
        cleanedPhoneNumber
      );

      mapping.channelName = newChannelName;
      await mapping.save();
    }
  });
}

function makeStringSlackFriendly(string) {
  return string.toLowerCase().replace(/ /g, "_").replace("[^a-zA-Z0-9-_]", "");
}

export async function getNamedChannel(contactName, company, clientId) {
  let formattedContactName = makeStringSlackFriendly(contactName);
  let newChannelName = generateSlackChannelName(formattedContactName);

  if (company) {
    let formattedCompany = makeStringSlackFriendly(company);
    newChannelName += "_" + formattedCompany;
  }

  // Check if there are other channels with this contact name already. If so, append a number after new channel name
  let mappingWithSameName = await PhoneMapping.find({
    client: clientId,
    channelName: newChannelName,
  });

  if (mappingWithSameName.length > 0) {
    newChannelName += "_" + mappingWithSameName.length;
  }

  return newChannelName;
}

export async function createChannelAndInviteDefaultRespondants(
  client,
  phoneMapping,
  channelName,
  userPhoneNumber
) {
  let accessToken = client.slack.accessToken;
  let channelId;

  // If we don't have a mapping of this phone number to a channel, create one
  if (!phoneMapping) {
    console.log("No mapping");
    channelId = await createNewSlackChannel(
      client.email,
      channelName,
      accessToken,
      userPhoneNumber,
      client.slack.createPrivateChannel
    );

    phoneMapping = new PhoneMapping({
      channelId: channelId,
      client: client._id,
      userPhoneNumber: userPhoneNumber,
      channelName: channelName,
    });

    await phoneMapping.save();
  } else {
    // If we do have a mapping of this phone number to a channel

    // Check if the mapping still works since the workspace may have changed
    let hasChannelInSlackWorkspace = false;
    console.log("Trying to see if this mapping still works");
    try {
      let res = await Slack.conversations.info({
        token: accessToken,
        channel: phoneMapping.channelId,
      });
      hasChannelInSlackWorkspace = true;
      channelId = phoneMapping.channelId;

      // Join the channel
      await Slack.conversations.join({
        token: accessToken,
        channel: channelId,
      });
    } catch (err) {
      console.log(
        err + ". Assuming workspace changed and need to create a channel"
      );
    }

    // If the client changed the Slack workspace, update the mapping to a channel in the new workspace
    if (!hasChannelInSlackWorkspace) {
      console.log("Workspace changed");
      channelId = await createNewSlackChannel(
        client.email,
        channelName,
        accessToken,
        userPhoneNumber,
        client.slack.createPrivateChannel
      );

      // Update existing mapping
      phoneMapping.channelId = channelId;
      phoneMapping.channelName = channelName;
      await phoneMapping.save();
    }
  }

  // Invite default respondents to the new channel
  if (
    client.slack.defaultRespondents &&
    client.slack.defaultRespondents.length > 0
  ) {
    for (let defaultRespondent of client.slack.defaultRespondents) {
      await inviteUserToChannel(defaultRespondent, channelId, accessToken);
    }
  }
  return phoneMapping;
}

export async function getSharedPublicURL(fileId, userAccessToken) {
  try {
    let response = await Slack.files.sharedPublicURL({
      file: fileId,
      token: userAccessToken,
    });
    return {
      success: true,
      publicURL: response.file.permalink_public,
    };
  } catch (error) {
    Sentry.captureException(error);
    console.log(error);
    return {
      success: false,
    };
  }
}

export async function getSlackChannelList(accessToken) {
  try {
    let response = await Slack.conversations.list({ token: accessToken });
    if (response.ok && response.channels.length > 0) {
      let channelList = [];
      for (let channelDetails of response.channels) {
        channelList.push({
          id: channelDetails.id,
          name: "#" + channelDetails.name,
        });
      }

      return {
        success: true,
        channelList,
      };
    }
  } catch (e) {
    console.log(e);
    return {
      success: false,
    };
  }
}

export async function inviteBotUserToChannel(channelId, accessToken) {
  try {
    let inviteUser = await Slack.conversations.join({
      channel: channelId,
      token: accessToken,
    });
    if (inviteUser.ok) {
      return {
        success: true,
      };
    }
    return {
      success: false,
      errorMessage: "Error in retrieving user from slack",
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      success: false,
      errorMessage: "Bot not found in slack",
    };
  }
}

export async function checkChannelExistsInWorkspace(accessToken, channelId) {
  let hasChannelInSlackWorkspace = false;
  let success = false;
  let message = "";
  try {
    await Slack.conversations.info({
      token: accessToken,
      channel: channelId,
    });
    hasChannelInSlackWorkspace = true;
    success = true;
    // Join the channel
    await Slack.conversations.join({
      token: accessToken,
      channel: channelId,
    });
  } catch (err) {
    console.log(
      err + ". Assuming workspace changed and need to create a channel"
    );
    message = err;
  }
  return {
    success: success,
    channelWorks: hasChannelInSlackWorkspace,
    message: message,
  };
}
