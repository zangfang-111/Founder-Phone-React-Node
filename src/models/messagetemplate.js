import mongoose from "mongoose";
const Schema = mongoose.Schema;

const messageTemplateSchema = new mongoose.Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  templateName: {
    type: Schema.Types.String,
    required: true,
  },
  templateMessage: {
    type: Schema.Types.String,
    required: true,
  },
});

const MessageTemplate = mongoose.model(
  "MessageTemplate",
  messageTemplateSchema
);

export default MessageTemplate;
