#!/bin/bash
heroku config -s -a $1 > config.txt
cat config.txt | tr '\n' ' ' | xargs heroku config:set -a $2

# See https://emirkarsiyakali.com/heroku-copying-environment-variables-from-an-existing-app-to-another-9253929198d9