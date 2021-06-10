import Agenda from "agenda";

require("dotenv").config();
export const agenda = new Agenda({ db: { address: process.env.DATABASE_URL } });

var normalizedPath = require("path").join(__dirname, "../jobs");
export var JOB_TYPES = {};

require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (file) {
    var jobFile = require("../jobs/" + file);
    JOB_TYPES[jobFile.JOB_NAME] = jobFile.JOB_NAME;
    jobFile.jobFunction(agenda);
  });

(async function () {
  await agenda.start();
})();
