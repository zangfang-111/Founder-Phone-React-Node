import Mailchimp from "mailchimp-api-v3";
import SendGridMail from "@sendgrid/mail";
import { parsePhoneNumberFromString } from "libphonenumber-js";

require("dotenv").config();

SendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

// var mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);

export function addToMailchimp(email) {
  // mailchimp
  //   .post("/lists/b51ba6997b/members", {
  //     email_address: email,
  //     status: "subscribed"
  //   })
  //   .catch(function(err) {
  //     console.log(err);
  //   });
}

export function sendSlackIncorrectConfigurationEmail(clientEmail) {
  const msg = {
    to: clientEmail,
    from: "no-reply@mail.founderphone.com",
    subject: "Your Slack is setup incorrectly for FounderPhone",
    text:
      "Hi there!\n\nWe noticed you tried to use FounderPhone, but your Slack doesn't allow FounderPhone to create channels. Ask your Slack admin to go to Administration > Workspace settings > Permissions > Channel Management and set people who can create private channels and public channels to Everyone. See this Slack help center article for more information: https://slack.com/help/articles/115004988303-Set-channel-management-preferences\n\nReach out if you have any questions. \n\nBest,\nYour friends at FounderPhone",
  };

  SendGridMail.send(msg, false, (err, result) => {
    if (err) {
      console.log("Error :" + err);
    } else {
      console.log("Email sent successfully");
    }
  });
}

export function sentSMSFailureEmail(clientEmail, fromNumber, message) {
  const msg = {
    to: clientEmail,
    from: "no-reply@mail.founderphone.com",
    subject: "A customer messaged you but we couldn't send it to your Slack",
    text:
      "You received a message from " +
      parsePhoneNumberFromString(fromNumber).formatNational() +
      ": '" +
      message +
      "', but you haven't connected your Slack to FounderPhone. Please visit founderphone.com to setup your Slack and receive texts.\n\nBest,\nYour friends at FounderPhone",
  };

  SendGridMail.send(msg, false, (err, result) => {
    if (err) {
      console.log("Error :" + err);
    } else {
      console.log("Email sent successfully");
    }
  });
}

export function sendTrialPeriodEndReminder(clientEmail) {
  const msg = {
    to: clientEmail,
    replyTo: "support@founderphone.com",
    from: "no-reply@mail.founderphone.com",
    subject: "Your FounderPhone trial is ending",
    text:
      "Hi there!\n\nWe hope you've had a great time trying FounderPhone. We just wanted to let you know that your trial is expiring in 2 days. Please visit founderphone.com and subscribe to continue using your number. If you're not interested in subscribing to a plan, we'd really appreciate any feedback. We build quickly and can address any issues you have asap. Reach out if you have any questions. \n\nBest,\nYour friends at FounderPhone",
  };

  SendGridMail.send(msg, false, (err, result) => {
    if (err) {
      console.log("Error :" + err);
    } else {
      console.log("Email sent successfully");
    }
  });
}

export function sendSMSInEmailForUnpaidClients(
  clientEmail,
  fromNumber,
  message
) {
  const msg = {
    to: clientEmail,
    from: "no-reply@mail.founderphone.com",
    replyTo: "support@founderphone.com",
    subject: "[IMPORTANT] Your customers are messaging you on FounderPhone!",
    text: `Hi there, \n\nYour customers are messaging you through FounderPhone:\n\n${parsePhoneNumberFromString(
      fromNumber
    ).formatNational()} : "${message}".\n\nPlease visit founderphone.com to subscribe to a plan and respond to these messages from Slack. If you have any issues please contact support@founderphone.com.\n\nBest,\nYour friends at FounderPhone`,
  };

  SendGridMail.send(msg, false, (err, result) => {
    if (err) {
      console.log("Error :" + err);
    } else {
      console.log("Email sent successfully");
    }
  });
}
