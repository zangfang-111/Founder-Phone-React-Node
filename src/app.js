// For ES6 support, see https://medium.freecodecamp.org/how-to-enable-es6-and-beyond-syntax-with-node-and-express-68d3e11fe1ab
import mongoose from "mongoose";
import cors from "cors";
import indexRouter from "./routes/index";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import logger from "morgan";
import * as Sentry from "@sentry/node";
import Mixpanel from "mixpanel";
import fileUpload from "express-fileupload";

require("dotenv").config();

let SENTRY_DSN = process.env.SENTRY_DSN;
let MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;

export const mixpanel = Mixpanel.init(MIXPANEL_TOKEN);

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV
});

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.use("/api/", cors(), indexRouter);

app.get("/", (req, res) => {
  res
    .status(200)
    .sendFile(path.join(__dirname, "../client/build", "home.html"));
});

app.get("/faq", (req, res) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, "../client/build", "faq.html"));
});

app.get("/about", (req, res) => {
  res
    .status(200)
    .sendFile(path.resolve(__dirname, "../client/build", "about.html"));
});

app.get("/privacy", (req, res) => {
  res.redirect(
    "https://www.notion.so/FounderPhone-Privacy-Policy-e3a4184ecc6842d8b08af9851470b881"
  );
});

app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

mongoose
  .connect(process.env.DATABASE_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("Mongo connected"))
  .catch((err) => {
    console.log(`DB Connection Error: ${err.message}`);
  });

export default app;
