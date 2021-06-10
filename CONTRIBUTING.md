# Requirements

Node v14.16.0

## MongoDB

Download from https://www.mongodb.com/try/download/community and install it.
Run `mongod --dbpath <dir>` and keep it running.



# Start Server

Run `npm install` to install dependencies.
Run `cp .env.example .env`  and populate `.env` with correct values. Refer to https://wiki.xtendify.com/share/f0f5d5bb-1ef8-4a88-80f7-9ee4571a85ea for server env variables.

## Setup Tunnel
We need to use tunnel so that we can forward requests from Slack/Twilio to localhost. You can use https://tunnelto.dev/ or any other similar service for the same.
Replace https://fp.tunnelto.dev with the new URL in `TWILIO_WEBHOOK`, `TWILIO_CALL_FORWARD` and `SERVER_URL` in `.env` file.

## Populate Slack credentaisl in env app
Create a Slack app for yourself using https://wiki.xtendify.com/share/0bea4dd2-b794-4147-af33-125d079a2494. Make sure you use tunnel URL instead of https://founderphone.com.
Update `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in `.env` file.

Run `npm start` to start server.



# Start Client

Run `npm install` to install dependencies.
Run `cp .env.example .env`  and populate `.env` with correct values. Refer to https://wiki.xtendify.com/share/f0f5d5bb-1ef8-4a88-80f7-9ee4571a85ea for client env variables.
Run `npm start` to start client.



# Create Pull Request
Push your changes under branch `issue/<123>`. Create a pull request mergering your changes to master and requesting review from Rohit.
