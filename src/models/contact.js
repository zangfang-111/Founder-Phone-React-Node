import mongoose from "mongoose";
const Schema = mongoose.Schema;

const contactSchema = new mongoose.Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  firstName: {
    type: Schema.Types.String,
    default: "",
    required: true,
  },
  lastName: {
    type: Schema.Types.String,
    default: "",
  },
  phoneNumber: {
    type: Schema.Types.String,
    default: "",
    required: true,
  },
  email: {
    type: Schema.Types.String,
  },
  company: {
    type: Schema.Types.String,
  },
  accountManager: {
    type: Schema.Types.String,
  },
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
