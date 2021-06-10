const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

// See https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development
// See https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/context-matching.md

// Matches landing page at / alone
var landingPageFilter = function (pathname, req) {
  let isLandingPage = pathname.match("^/$") && req.method === "GET";
  let landingPageEndpoints = ["api", "faq", "tos", "privacy"];

  let endpoint = pathname.substring(1); //remove first forward slash in path

  if (isLandingPage || landingPageEndpoints.includes(endpoint)) {
    return true;
  }
  return false;
};

let serverUrl = "http://localhost:3001";

module.exports = function (app) {
  const proxy = createProxyMiddleware(landingPageFilter, { target: serverUrl });
  app.use(proxy);
};
