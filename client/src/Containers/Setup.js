import React, { Component, Fragment } from "react";
import { withStyles } from "@material-ui/styles";
import { withRouter } from "react-router-dom";
import ReactGA from "react-ga";
import styles from "./styles/SetupStyles";
import {
  Button,
  Container,
  Grid,
  Typography,
  TextField,
  Tooltip,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import clsx from "clsx";
import FileCopy from "@material-ui/icons/FileCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { notify } from "react-notify-toast";
import * as Sentry from "@sentry/browser";
import Header from "../Components/Header";
import {
  addCallRedirection,
  applyPromo,
  connectToGoogle,
  connectToHubSpot,
  connectToSlack,
  createContactsFromCsv,
  createPrivateChannelInSlack,
  fetchWebhookUrl,
  getClientAccount,
  getSlackChannels,
  saveChannelId,
  saveMessageFormat,
  subscribetoplan,
  unsubscribetoplan,
  updateWebhook,
} from "../Services/Api";
import mixpanel from "mixpanel-browser";
import "firebase/auth";
import images from "../Themes/Images";
import { planTypes, slackMessageFormat } from "../Utils/Types";
import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js";
import InviteSlackMembers from "../Components/InviteSlackMembers";
import queryString from "query-string";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { formatPhoneNumber, cleanPhoneNumber } from "../Utils/PhoneUtils";
import StyledDropZone from "react-drop-zone/dist/StyledDropZone";
import "react-drop-zone/dist/styles.css";
import RefreshIcon from "@material-ui/icons/Refresh";

const NOTIFICATION_LENGTH = 6000;

class Setup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      haveCardOnFile: false,
      currentPlan: planTypes.NOT_PAID,
      requestForDowngrade: false,
      expirationDate: null,
      nextPlan: "",
      phoneNumber: "",
      teamName: "",
      slackConnectedDialog: false,
      defaultRespondents: [],
      newDefaultRespondents: "",
      callRedirectNumber: "",
      forwardText: false,
      forwardToSlackFirst: false,
      hideCheckoutForm: false,
      contactsSynced: 0,
      promo: "",
      createPrivateChannel: false,
      isChannelsFormat: true,
      defaultChannelId: "",
      channels: [],
      webHookURL: "",
      webhookLoading: false
    };
  }

  componentDidMount() {
    ReactGA.pageview("Home");
    Sentry.captureMessage("Home");
    mixpanel.track("Home");

    this.load();
    fetchWebhookUrl().then((res) => {
      this.setState({
        webHookURL: res.data,
      });
    });
  }

  onCopy = () => {
    notify.show("Copied phone number", "success", NOTIFICATION_LENGTH);
  };

  connectToSlackFn = () => {
    ReactGA.event({
      category: "User",
      action: "Connect to Slack",
    });
    Sentry.captureMessage("Connect to Slack");
    mixpanel.track("Connect to Slack");

    connectToSlack();
  };

  connectToGoogleFn = () => {
    ReactGA.event({
      category: "User",
      action: "Connect to Google Contacts",
    });
    Sentry.captureMessage("Connect to Google Contacts");
    mixpanel.track("Connect to Google Contacts");

    connectToGoogle();
  };

  connectToHubSpotFn = () => {
    ReactGA.event({
      category: "User",
      action: "Connect to HubSpot",
    });
    Sentry.captureMessage("Connect to Hubspot Contacts");
    mixpanel.track("Connect to Hubspot Contacts");

    connectToHubSpot();
  };

  saveWebHook = () => {
    const { webHookURL } = this.state;

    this.setState({
      webhookLoading: true
    })

    updateWebhook(webHookURL)
      .then(() => {
        notify.show("Webhook updated", "success", NOTIFICATION_LENGTH);
      })
      .catch(() => {
        notify.show("Webhook failed to update", "error", NOTIFICATION_LENGTH);
      }).finally(() => {
        this.setState({
          webhookLoading: false
        })
      });
  };

  updateCallback = (message) => {
    notify.show(message, "success", NOTIFICATION_LENGTH);
    this.load();
  };

  load = () => {
    const params = queryString.parse(this.props.location.search);

    getClientAccount((res) => {
      if (res.status === 200) {
        this.setState(
          {
            haveCardOnFile: res.data.haveCardOnFile,
            hideCheckoutForm: res.data.haveCardOnFile,
            payments: res.data.payments,
            currentPlan: res.data.currentPlan,
            nextPlan: res.data.nextPlan,
            expirationDate: res.data.expirationDate,
            requestForDowngrade: res.data.requestForDowngrade,
            phoneNumber: res.data.phoneNumber,
            teamName: res.data.teamName,
            slackConnectedDialog: params.showdialog === "true",
            defaultRespondents: res.data.defaultRespondents,
            callRedirectNumber: new AsYouType("US").input(
              res.data.callRedirectNumber
            ),
            forwardText: res.data.forwardText,
            forwardToSlackFirst: res.data.forwardToSlackFirst,
            contactsSynced: res.data.contactsSynced,
            createPrivateChannel: res.data.createPrivateChannel,
            isChannelsFormat:
              res.data.messageFormat === slackMessageFormat.CHANNEL,
            defaultChannelId: res.data.defaultChannelId,
          },
          () => {
            this.getSlackChannelsFn();
          }
        );
      } else {
        notify.show(
          "We couldn't retrieve your account details. Try again later or contact support@founderphone.com",
          "error",
          NOTIFICATION_LENGTH
        );
      }
    });
  };

  getSlackChannelsFn = () => {
    getSlackChannels((res) => {
      if (res.status === 200) {
        this.setState({ channels: res.data });
      }
    });
  };
  handleCallRedirectChange = (event) => {
    let asYouType = new AsYouType("US");

    this.setState({
      callRedirectNumber: asYouType.input(event.target.value),
    });
  };

  handleTextChange = (e) =>
    this.setState({ [e.target.name]: e.target.value.toUpperCase() });

  applyPromoFn = () => {
    const { promo } = this.state;
    applyPromo(promo, (res) => {
      if (res.status === 200) {
        this.updateCallback(res.data.message);
      } else if (res.status === 400 && res.data) {
        notify.show(res.data.message, "error", NOTIFICATION_LENGTH);
      }
    });
  };

  subscribe = () => {
    ReactGA.event({
      category: "User",
      action: "Subscribed",
    });
    Sentry.captureMessage("Subscribed");
    mixpanel.track("Subscribed");

    subscribetoplan((res) => {
      this.updateCallback(res.data.message);
    });
  };

  unsubscribe = () => {
    ReactGA.event({
      category: "User",
      action: "Unsubscribed",
    });
    Sentry.captureMessage("Unsubscribed");
    mixpanel.track("Unsubscribed");

    unsubscribetoplan((res) => {
      this.updateCallback("Cancelled your subscription");
    });
  };

  saveCallRedirect = () => {
    let {
      phoneNumber,
      callRedirectNumber,
      forwardText,
      forwardToSlackFirst,
    } = this.state;

    var parsedCallRedirectNumber = parsePhoneNumberFromString(
      formatPhoneNumber(cleanPhoneNumber(callRedirectNumber))
    );

    if (!parsedCallRedirectNumber || !parsedCallRedirectNumber.isValid()) {
      notify.show(
        "Please enter your number in this format with country code: +1 202 555 0160",
        "error",
        NOTIFICATION_LENGTH
      );
      return;
    }

    addCallRedirection(
      parsedCallRedirectNumber.number,
      forwardText,
      forwardToSlackFirst,
      (res) => {
        this.setState({
          callRedirectNumber: parsedCallRedirectNumber.formatInternational(),
        });
        if (res.status === 200) {
          notify.show(
            `Great, we will forward calls from ${parsePhoneNumberFromString(
              phoneNumber
            ).formatInternational()} to ${parsedCallRedirectNumber.formatInternational()}`,
            "success",
            NOTIFICATION_LENGTH
          );
        } else {
          notify.show(
            "Oops. We couldn't save your call redirect number. Please contact support@founderphone.com",
            "error",
            NOTIFICATION_LENGTH
          );
        }
      }
    );
  };

  onFileChange = async (file) => {
    createContactsFromCsv(file, (res) => {
      if (res.status === 200) {
        this.updateCallback("Uploaded contacts");
      }
    });
  };

  handleForwardCallToSlackChange = () => {
    this.setState(
      (prevState, props) => ({
        forwardToSlackFirst: !prevState.forwardToSlackFirst,
      }),
      () => {
        this.saveCallRedirect();
      }
    );
  };

  handleCreatePrivateChannel = () => {
    let { createPrivateChannel } = this.state;
    createPrivateChannelInSlack(!createPrivateChannel, (res) => {
      if (res.status === 200) {
        this.setState(
          {
            createPrivateChannel: res.data.createPrivateChannel,
          },
          () => {
            let createPrivateChannel = this.state.createPrivateChannel;
            let message = createPrivateChannel
              ? "All new channels will be private moving forward"
              : "All new channels will be public moving forward";
            notify.show(message, "success", NOTIFICATION_LENGTH);
          }
        );
      } else {
        notify.show(
          "Hmmm... we couldn't update your settings. Please try again later",
          "error",
          NOTIFICATION_LENGTH
        );
      }
    });
  };

  handleMessageFormatChange = (name) => (event) => {
    this.setState({ isChannelsFormat: event.target.checked }, () => {
      let messageFormat = this.state.isChannelsFormat
        ? slackMessageFormat.CHANNEL
        : slackMessageFormat.THREAD;
      saveMessageFormat(messageFormat, (res) => {
        if (res.status === 200) {
          notify.show(
            "Saved your new message format",
            "success",
            NOTIFICATION_LENGTH
          );
        }
      });
    });
  };

  handleSelectChange = (event) => {
    this.setState({ [event.target.name]: event.target.value }, () => {
      this.saveChannelIdFn();
    });
  };

  saveChannelIdFn = () => {
    const { defaultChannelId } = this.state;
    if (defaultChannelId === "") {
      notify.show(
        "Please select a channel before saving",
        "error",
        NOTIFICATION_LENGTH
      );
      return;
    }

    saveChannelId(defaultChannelId, (res) => {
      if (res.status === 200) {
        notify.show(
          "Saved your new default channel",
          "success",
          NOTIFICATION_LENGTH
        );
      }
    });
  };

  renderWebhookSection = () => {
    const { classes } = this.props;
    const { webHookURL, webhookLoading } = this.state;

    return (
      <Grid item className={classes.marginBottom30}>
        <Paper
          className={[
            classes.marginTop10,
            classes.width100,
            classes.paper,
            classes.padding20,
          ].join(" ")}
        >
          <Grid item className={classes.width100}>
            <Typography
              variant="subtitle2"
              className={classes.headerStyle}
            >
              Webhook
          </Typography>
            <Typography
              variant="subtitle2"
              className={[
                classes.marginTop10,
                classes.textStyle,
                classes.padding10,
              ].join(" ")}
            >
              You can subscribe to be notified of events in FounderPhone
              (for example, when a new message is sent or received) at a
              URL of your choice.
          </Typography>

            <Grid item container direction="row" spacing={2}>
              <Grid item xs={9} sm={6}>
                <TextField
                  id="outlined-dense"
                  rows={1}
                  rowsMax={1}
                  value={webHookURL}
                  margin="none"
                  onChange={(e) => {
                    this.setState({
                      webHookURL: e.target.value,
                    });
                  }}
                  placeholder="URL"
                  fullWidth
                  className={[
                    classes.redirectNumberWidth,
                    classes.margin10,
                  ].join(", ")}
                  helperText="We will make a POST request to the URL. Webhook will be disabled if call fails."
                />
              </Grid>

              <Grid item xs={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.saveWebHook}
                  className={classes.margin10}
                  disabled={webhookLoading}
                >
                  Save
              </Button>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    )
  }

  render() {
    const { classes } = this.props;
    const {
      currentPlan,
      phoneNumber,
      teamName,
      slackConnectedDialog,
      callRedirectNumber,
      contactsSynced,
      forwardToSlackFirst,
      createPrivateChannel,
      isChannelsFormat,
      channels,
      defaultChannelId,
    } = this.state;

    let formattedPhoneNumber;
    if (phoneNumber) {
      formattedPhoneNumber = parsePhoneNumberFromString(
        phoneNumber
      ).formatNational();
    }

    return (
      <div className={classes.parentContainer}>
        <Container className={classes.container}>
          <Header />
          <Grid
            container
            direction="column"
            justify="center"
            className={classes.innerContainer}
          >
            <Grid item className={classes.marginBottom30}>
              <Paper
                className={[
                  classes.marginTop10,
                  classes.width100,
                  classes.paper,
                ].join(" ")}
              >
                <Grid
                  container
                  className={[classes.padding20, classes.width100].join(" ")}
                >
                  <Grid item className={classes.width100}>
                    <Typography
                      variant="subtitle2"
                      className={classes.headerStyle}
                    >
                      How does this work?
                    </Typography>

                    {(currentPlan === planTypes.PAID ||
                      currentPlan === planTypes.TRIAL) &&
                      phoneNumber ? (
                      <Typography
                        variant="subtitle2"
                        className={[
                          classes.marginTop10,
                          classes.textStyle,
                          classes.padding10,
                        ].join(" ")}
                      >
                        {!teamName && "Click Add to Slack below. "}
                        Your phone number is <b>{formattedPhoneNumber}</b>
                        <br />
                        <br />
                        Upload your contacts below and click on Campaign in the
                        nav menu on the left to send a personalized text to your
                        customers with your new number! You can always visit{" "}
                        <a href="https://help.founderphone.com">
                          help.founderphone.com
                        </a>{" "}
                        for instructions.
                      </Typography>
                    ) : (
                      <Fragment>
                        <Typography
                          variant="subtitle2"
                          className={[
                            classes.marginTop10,
                            classes.textStyle,
                            classes.padding10,
                          ].join(" ")}
                        >
                          Your trial has ended. Subscribe to a plan to continue.
                          Then click Add to Slack. We'll generate a phone number
                          that you can give to your customers! For detailed
                          instructions, visit{" "}
                          <a href="https://help.founderphone.com">
                            help.founderphone.com
                          </a>
                        </Typography>
                      </Fragment>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item className={classes.marginBottom30}>
              <Paper
                className={[
                  classes.marginTop10,
                  classes.width100,
                  classes.paper,
                ].join(" ")}
              >
                <Grid
                  container
                  className={[classes.padding20, classes.width100].join(" ")}
                >
                  <Grid item className={classes.width100}>
                    <Typography
                      variant="subtitle2"
                      className={classes.headerStyle}
                    >
                      Connect to Slack
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      className={[
                        classes.marginTop10,
                        classes.textStyle,
                        classes.padding10,
                      ].join(" ")}
                    >
                      {currentPlan === planTypes.NOT_PAID
                        ? "Open up Billing in the left nav and subscribe to a plan to connect to Slack"
                        : teamName
                          ? "Connected to " +
                          teamName +
                          ". All your messages will be forwarded there"
                          : "Connect your Slack to send and receive messages from the above phone number"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {currentPlan === planTypes.PAID ||
                      currentPlan === planTypes.TRIAL ? (
                      <Button
                        style={{ paddingLeft: 5 }}
                        onClick={() => this.connectToSlackFn()}
                        startIcon={
                          <img
                            src={images.slackLogo}
                            alt="slacklogo"
                            className={classes.iconButton}
                          ></img>
                        }
                      >
                        {teamName ? "Change Slack" : "Add to Slack"}
                      </Button>
                    ) : (
                      <div></div>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {teamName &&
              (currentPlan === planTypes.PAID ||
                currentPlan === planTypes.TRIAL) && (
                <Grid item className={classes.marginBottom30}>
                  <Paper
                    className={[
                      classes.marginTop10,
                      classes.width100,
                      classes.paper,
                    ].join(" ")}
                  >
                    <Grid
                      container
                      className={[classes.padding20, classes.width100].join(
                        " "
                      )}
                    >
                      <Grid item className={classes.width100}>
                        <Typography
                          variant="subtitle2"
                          className={classes.headerStyle}
                        >
                          Message format
                        </Typography>

                        <Typography
                          variant="subtitle2"
                          className={[
                            classes.marginTop10,
                            classes.textStyle,
                            classes.padding10,
                          ].join(" ")}
                        >
                          Post messages in a private channel
                        </Typography>
                      </Grid>
                      {/* <Grid item xs={12}>
                        <FormControlLabel
                          style={{ marginLeft: 2 }}
                          control={
                            <Switch
                              checked={isChannelsFormat}
                              color="primary"
                              onChange={this.handleMessageFormatChange()}
                              inputProps={{
                                "aria-label": "secondary checkbox"
                              }}
                            />
                          }
                          label="Separate channels"
                        />
                      </Grid> */}
                      <Grid item xs={12}>
                        {isChannelsFormat ? (
                          <FormControlLabel
                            style={{ marginTop: 10 }}
                            control={
                              <Checkbox
                                checked={createPrivateChannel}
                                className={classes.privateChannelCheckbox}
                                onChange={this.handleCreatePrivateChannel}
                                value="Create private slack channel"
                                color="primary"
                              />
                            }
                            label="Create private channels for incoming texts"
                          />
                        ) : (
                          <div
                            style={{ display: "inline-flex", width: "100%" }}
                          >
                            <FormControl
                              variant="outlined"
                              className={classes.formControl}
                              style={{ width: "20%", marginTop: 10 }}
                            >
                              <InputLabel id="demo-simple-select-outlined-label">
                                Select channel
                              </InputLabel>
                              <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                value={defaultChannelId}
                                onChange={this.handleSelectChange}
                                style={{ width: "100%" }}
                                name="defaultChannelId"
                                labelWidth={120}
                              >
                                {channels.map((channel) => {
                                  return (
                                    <MenuItem
                                      value={channel.id}
                                      key={channel.id}
                                    >
                                      {channel.name}
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                            <RefreshIcon
                              style={{ margin: 25, cursor: "pointer" }}
                              onClick={this.getSlackChannelsFn}
                            />
                          </div>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

            {(currentPlan === planTypes.PAID ||
              currentPlan === planTypes.TRIAL) &&
              phoneNumber && (
                <Grid item className={classes.marginBottom30}>
                  <Paper
                    className={[
                      classes.marginTop10,
                      classes.width100,
                      classes.paper,
                    ].join(" ")}
                  >
                    <Grid
                      container
                      className={[classes.padding20, classes.width100].join(
                        " "
                      )}
                    >
                      <Grid item className={classes.width100}>
                        <Typography
                          variant="subtitle2"
                          className={classes.headerStyle}
                        >
                          Your phone number
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          className={[
                            classes.marginTop10,
                            classes.textStyle,
                            classes.padding10,
                          ].join(" ")}
                        >
                          Any texts sent to this number will be forwarded to
                          your Slack. Share it with your customers
                        </Typography>
                        {(currentPlan === planTypes.PAID ||
                          currentPlan === planTypes.TRIAL) &&
                          phoneNumber && (
                            <Grid item container direction="row">
                              <Grid
                                item
                                xs={9}
                                sm={4}
                                className={classes.marginLeft10}
                              >
                                <TextField
                                  id="outlined-dense"
                                  className={[
                                    classes.marginTop10,
                                    classes.padding10,
                                    classes.phoneNumberWidth,
                                    clsx(classes.textField, classes.dense),
                                    classes.codeStyle,
                                  ].join(" ")}
                                  value={formattedPhoneNumber}
                                  rows={1}
                                  rowsMax={1}
                                  contentEditable={false}
                                  onFocus={this.handleFocus}
                                  margin="dense"
                                  InputProps={{
                                    classes: {
                                      input: classes.codeFont,
                                    },
                                  }}
                                />
                              </Grid>

                              <Grid item xs={2}>
                                <CopyToClipboard
                                  onCopy={this.onCopy}
                                  text={formattedPhoneNumber}
                                  className={classes.copyButton}
                                >
                                  <Tooltip title="Copy phone number">
                                    <IconButton>
                                      <FileCopy />
                                    </IconButton>
                                  </Tooltip>
                                </CopyToClipboard>
                              </Grid>
                            </Grid>
                          )}
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

            {(currentPlan === planTypes.PAID ||
              currentPlan === planTypes.TRIAL) &&
              teamName && (
                <Grid item className={classes.marginBottom30}>
                  <Paper
                    className={[
                      classes.marginTop10,
                      classes.width100,
                      classes.paper,
                    ].join(" ")}
                  >
                    <InviteSlackMembers
                      message={
                        "Connected to " +
                        teamName +
                        ". These users will be invited to every new channel by default"
                      }
                      header={"Default respondents"}
                    />
                  </Paper>
                </Grid>
              )}

            {(currentPlan === planTypes.PAID ||
              currentPlan === planTypes.TRIAL) &&
              phoneNumber && (
                <Grid item className={classes.marginBottom30}>
                  <Paper
                    className={[
                      classes.marginTop10,
                      classes.width100,
                      classes.paper,
                    ].join(" ")}
                  >
                    <Grid
                      container
                      className={[classes.padding20, classes.width100].join(
                        " "
                      )}
                    >
                      <Grid item className={classes.width100}>
                        <Typography
                          variant="subtitle2"
                          className={classes.headerStyle}
                        >
                          Forward voice calls
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          className={[
                            classes.marginTop10,
                            classes.textStyle,
                            classes.padding10,
                          ].join(" ")}
                        >
                          {(currentPlan === planTypes.PAID ||
                            currentPlan === planTypes.TRIAL) &&
                            phoneNumber
                            ? "We'll forward any calls to the above number to your actual phone number" +
                            (forwardToSlackFirst
                              ? ". We'll share calls in Slack first for your team to answer before forwarding it to you"
                              : "")
                            : "Add your card and hit subscribe to add call redirection to your phone number"}
                        </Typography>
                        {(currentPlan === planTypes.PAID ||
                          currentPlan === planTypes.TRIAL) &&
                          phoneNumber && (
                            <Fragment>
                              <Grid
                                item
                                container
                                direction="row"
                                spacing={2}
                                className={classes.padding10}
                              >
                                <Grid item xs={7} sm={3}>
                                  <TextField
                                    id="outlined-dense"
                                    rows={1}
                                    rowsMax={1}
                                    value={callRedirectNumber}
                                    margin="none"
                                    onChange={this.handleCallRedirectChange}
                                    placeholder="+12025550160"
                                    fullWidth
                                    className={[
                                      classes.redirectNumberWidth,
                                      classes.margin10,
                                    ].join(", ")}
                                  />
                                </Grid>

                                <Grid item xs={1}>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={this.saveCallRedirect}
                                    className={classes.margin10}
                                  >
                                    Save
                                  </Button>
                                </Grid>
                              </Grid>
                              <FormControlLabel
                                style={{ marginLeft: 10 }}
                                control={
                                  <Checkbox
                                    checked={forwardToSlackFirst}
                                    onChange={
                                      this.handleForwardCallToSlackChange
                                    }
                                    color="primary"
                                  />
                                }
                                label="Send calls to Slack for my team to answer before defaulting to this number"
                              />
                              {/* <FormControlLabel
                                style={{ marginLeft: 10 }}
                                control={
                                  <Checkbox
                                    checked={forwardText}
                                    onChange={this.handleForwardTextChange}
                                    color="primary"
                                  />
                                }
                                label="Forwad texts too"
                              /> */}
                            </Fragment>
                          )}
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

            {(currentPlan === planTypes.PAID ||
              currentPlan === planTypes.TRIAL) && (
                <Grid item className={classes.marginBottom30}>
                  <Paper
                    className={[
                      classes.marginTop10,
                      classes.width100,
                      classes.paper,
                      classes.padding20,
                    ].join(" ")}
                  >
                    <Grid item className={classes.width100}>
                      <Typography
                        variant="subtitle2"
                        className={classes.headerStyle}
                      >
                        Sync your contacts
                    </Typography>
                      <Typography
                        variant="subtitle2"
                        className={[
                          classes.marginTop10,
                          classes.textStyle,
                          classes.padding10,
                        ].join(" ")}
                      >
                        Share your contacts or HubSpot with us and we'll
                        automatically name your Slack channels instead of using a
                        phone number
                    </Typography>
                      <Fragment>
                        <Typography
                          variant="subtitle2"
                          className={[
                            classes.marginTop10,
                            classes.textStyle,
                            classes.padding10,
                          ].join(" ")}
                        >
                          {contactsSynced} contact(s) synced
                      </Typography>
                        <Grid
                          item
                          container
                          direction="row"
                          spacing={2}
                          className={classes.padding10}
                        >
                          {/* <Grid item xs={12} sm={3}>
                            <Button
                              className={classes.buttonWidth}
                              variant="contained"
                              color="primary"
                              onClick={this.connectToGoogle}
                            >
                              Pull from Google Contacts
                            </Button>
                          </Grid> */}

                          <Grid item xs={12} sm={3}>
                            <Button
                              className={classes.buttonWidth}
                              variant="contained"
                              color="primary"
                              onClick={this.connectToHubSpotFn}
                            >
                              Pull from HubSpot
                          </Button>
                          </Grid>
                          <Grid item xs={12} style={{ margin: 12 }}>
                            <StyledDropZone
                              onDrop={(file, text) => this.onFileChange(file)}
                              label="Upload from Google, Outlook CSV or iOS vCard files"
                            />
                          </Grid>
                        </Grid>
                      </Fragment>
                    </Grid>
                  </Paper>
                </Grid>
              )}

            {(currentPlan === planTypes.PAID ||
              currentPlan === planTypes.TRIAL) && this.renderWebhookSection()}
          </Grid>

          <Dialog
            open={slackConnectedDialog}
            className={classes.margin10}
            onClose={() => {
              this.setState({ slackConnectedDialog: !slackConnectedDialog });
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              You should have text forwarding to Slack working now!
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Text {formattedPhoneNumber} and head to your Slack to see if a
                new channel was created with the forwarded SMS
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  this.setState({
                    slackConnectedDialog: !slackConnectedDialog,
                  });
                }}
                style={{ margin: "auto", marginBottom: 10 }}
                variant="contained"
                color="primary"
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </div>
    );
  }
}

export default withRouter(withStyles(styles)(Setup));
