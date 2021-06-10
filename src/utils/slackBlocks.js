export const ANSWER_CALL = "Answer Call";

export function getIncomingCallBlock(callSid, phoneNumber) {
  let block = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":phone: " + phoneNumber + " is calling",
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: ANSWER_CALL,
        },
        value: callSid,
      },
    },
  ];
  return JSON.stringify(block);
}

export function getPhoneNumberModal(callSid) {
  let modal = {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Answer call",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Answer",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    private_metadata: callSid,
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "Enter your phone number and hit Answer",
        },
      },
      {
        type: "input",
        block_id: "phonenumberblock",
        hint: {
          type: "plain_text",
          text: "Include the country code unless it's a U.S. number",
        },
        element: {
          type: "plain_text_input",
          action_id: "forwarded_number",
          placeholder: {
            type: "plain_text",
            text: "12025550124",
          },
        },
        label: {
          type: "plain_text",
          text: "Your phone number",
        },
      },
    ],
  };

  return JSON.stringify(modal);
}
