import React, { Component } from "react";
import { CardElement, injectStripe } from "react-stripe-elements";
import { Typography, Button, Paper } from "@material-ui/core";
import PropTypes from "prop-types";
import ReactGA from "react-ga";
import { withStyles } from "@material-ui/styles";
import styles from "./styles/CheckoutFormStyle";
import { saveCard, subscribetoplan } from "../Services/Api";
import * as Sentry from "@sentry/browser";
import mixpanel from "mixpanel-browser";

const createOptions = () => {
  return {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: "Open Sans, sans-serif",
        letterSpacing: "0.025em",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#c23d4b",
      },
    },
  };
};

class CheckoutForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: "",
      loading: false,
    };
  }

  handleChange = ({ error }) => {
    if (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  save = async (ev) => {
    this.setState({ loading: true });
    ReactGA.event({
      category: "User",
      action: "Save card",
    });

    Sentry.captureMessage("Save card");
    mixpanel.track("Save card");

    let { token } = await this.props.stripe.createToken();
    if (token) {
      saveCard(token.id, (res) => {
        if (res.status === 200) {
          this.setState({ haveCardOnFile: true });
          // this.props.updateCallback("Your card was saved");
          subscribetoplan((res) => {
            this.setState({ loading: false });
            this.props.updateCallback(res.data.message);
          });
        }
      });
    }
  };

  render() {
    const { classes, haveCardOnFile } = this.props;
    const { loading } = this.state;

    return (
      <div className={classes.width100}>
        <div className={classes.cardFormContainer}>
          {haveCardOnFile ? (
            <Typography
              className={[classes.cardOnFile, classes.headerStyle].join(" ")}
            >
              You already have a card on file. Enter new card information to
              update it
            </Typography>
          ) : (
            <Typography className={classes.cardOnFile}>
              Enter your credit card information
            </Typography>
          )}
          <div className={classes.cardEntryForm}>
            <div>
              <Paper className={classes.cardForm}>
                <CardElement
                  onChange={this.handleChange}
                  {...createOptions()}
                />
              </Paper>
            </div>
            <div>
              {/* <div className={classes.saveButton}> */}
              <Button
                variant="contained"
                color="primary"
                className={classes.saveButtonStyle}
                onClick={this.save}
                disabled={loading}
              >
                {loading ? "Subscribing you..." : "Subscribe"}
              </Button>
              {/* </div> */}
            </div>
          </div>
          <div className="error" role="alert">
            {this.state.errorMessage}
          </div>
          <div className={classes.saveButton}></div>
        </div>
      </div>
    );
  }
}

CheckoutForm.propTypes = {
  haveCardOnFile: PropTypes.bool.isRequired,
  updateCallback: PropTypes.func.isRequired,
};

export default injectStripe(withStyles(styles)(CheckoutForm));
