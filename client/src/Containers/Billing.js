import React, { Component } from "react";
import { withStyles } from "@material-ui/styles";
import { withRouter } from "react-router-dom";
import ReactGA from "react-ga";
import styles from "./styles/BillingStyle";
import { Button, Container, Grid, Typography } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import { notify } from "react-notify-toast";
import * as Sentry from "@sentry/browser";
import Header from "../Components/Header";
import {
  getClientAccount,
  subscribetoplan,
  unsubscribetoplan,
} from "../Services/Api";
import mixpanel from "mixpanel-browser";
import "firebase/auth";
import CheckoutForm from "../Components/CheckoutForm";
import { Elements, StripeProvider } from "react-stripe-elements";
import { planTypes } from "../Utils/Types";
import { formatForDisplayDate } from "../Utils/TimeUtils";
import "react-drop-zone/dist/styles.css";

const NOTIFICATION_LENGTH = 6000;

class Billing extends Component {
  constructor(props) {
    super(props);

    this.state = {
      haveCardOnFile: false,
      currentPlan: planTypes.NOT_PAID,
      requestForDowngrade: false,
      expirationDate: null,
      nextPlan: "",
      hideCheckoutForm: false,
      promo: "",
      phoneNumber: "",
    };
  }

  componentDidMount() {
    ReactGA.pageview("Home");
    Sentry.captureMessage("Home");
    mixpanel.track("Home");

    this.load();
  }

  updateCallback = (message) => {
    notify.show(message, "success", NOTIFICATION_LENGTH);
    this.load();
  };

  load = () => {
    getClientAccount((res) => {
      if (res.status === 200) {
        this.setState({
          haveCardOnFile: res.data.haveCardOnFile,
          hideCheckoutForm: res.data.haveCardOnFile,
          payments: res.data.payments,
          currentPlan: res.data.currentPlan,
          nextPlan: res.data.nextPlan,
          expirationDate: res.data.expirationDate,
          requestForDowngrade: res.data.requestForDowngrade,
          phoneNumber: res.data.phoneNumber,
        });
      } else {
        notify.show(
          "We couldn't retrieve your account details. Try again later",
          "error",
          NOTIFICATION_LENGTH
        );
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

  render() {
    const { classes } = this.props;
    const {
      haveCardOnFile,
      currentPlan,
      requestForDowngrade,
      expirationDate,
      hideCheckoutForm,
      phoneNumber,
    } = this.state;

    let STRIPE_API_KEY = process.env.REACT_APP_STRIPE_API_KEY;

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
                      Payment Information
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      className={[
                        classes.marginTop10,
                        classes.textStyle,
                        classes.padding10,
                      ].join(" ")}
                    >
                      $27/month for up to 3 users. Contact us at
                      support@founderphone.com for custom plans
                    </Typography>
                    {requestForDowngrade && expirationDate && (
                      <Typography
                        variant="subtitle2"
                        className={[
                          classes.marginTop10,
                          classes.textStyle,
                          classes.padding10,
                        ].join(" ")}
                      >
                        Your service will be discontinued and you'll lose access
                        to this phone number on{" "}
                        {formatForDisplayDate(expirationDate)}
                      </Typography>
                    )}
                    <Grid
                      container
                      className={[classes.padding10, classes.width100].join(
                        " "
                      )}
                    >
                      <Grid item className={classes.width100}>
                        {haveCardOnFile && hideCheckoutForm ? (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              this.setState({ hideCheckoutForm: false });
                            }}
                            className={[
                              classes.changeCard,
                              classes.buttonWidth,
                            ].join(" ")}
                          >
                            Change card
                          </Button>
                        ) : (
                          <StripeProvider apiKey={STRIPE_API_KEY}>
                            <Elements>
                              <CheckoutForm
                                haveCardOnFile={haveCardOnFile}
                                currentPlan={currentPlan}
                                updateCallback={this.updateCallback}
                              />
                            </Elements>
                          </StripeProvider>
                        )}
                      </Grid>
                      <Grid item className={classes.width100}>
                        {haveCardOnFile && hideCheckoutForm && (
                          <div
                            style={{
                              display: "inline-flex",
                              width: "100%",
                              marginTop: 10,
                            }}
                          >
                            <div
                              className={[
                                classes.padding10,
                                classes.width100,
                              ].join(" ")}
                            >
                              {currentPlan === planTypes.PAID &&
                              phoneNumber &&
                              !requestForDowngrade ? (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={this.unsubscribe}
                                  className={classes.buttonWidth}
                                >
                                  Cancel subscription
                                </Button>
                              ) : (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={this.subscribe}
                                  className={classes.buttonWidth}
                                >
                                  Subscribe
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </div>
    );
  }
}

export default withRouter(withStyles(styles)(Billing));
