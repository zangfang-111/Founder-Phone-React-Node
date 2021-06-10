import React, { Component } from "react";
import { withStyles } from "@material-ui/styles";
import { Grid, Typography } from "@material-ui/core";
import ReactGA from "react-ga";
import { Switch, Route } from "react-router";
import { Link } from "react-router-dom";
import HomeIcon from "@material-ui/icons/Home";
import MessageIcon from "@material-ui/icons/Message";
import AccountBalanceIcon from "@material-ui/icons/AccountBalance";
import Notifications from "react-notify-toast";
import * as Sentry from "@sentry/browser";
import mixpanel from "mixpanel-browser";
import queryString from "query-string";
import ForumIcon from "@material-ui/icons/Forum";

import Setup from "./Setup";
import Campaign from "./Campaign";
import Billing from "./Billing";
import styles from "./styles/HomeStyle";
import Images from "../Themes/Images";
import { notify } from "react-notify-toast";
import MessageLog from "./MessageLog";

const NOTIFICATION_LENGTH = 6000;

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      componentToLoad: "setup",
    };
  }

  componentDidMount() {
    ReactGA.pageview("Home");
    Sentry.captureMessage("Home");
    mixpanel.track("Home");

    const params = queryString.parse(this.props.location.search);

    if (params.hubspotconnected) {
      notify.show("Connected to HubSpot", "success", NOTIFICATION_LENGTH);
    } else if (params.googleconnected) {
      notify.show(
        "Pulled from Google Contacts",
        "success",
        NOTIFICATION_LENGTH
      );
    }
  }

  setComponent = (component) => {
    ReactGA.event({
      category: "User",
      action: "Clicked " + component,
    });

    Sentry.captureMessage("Clicked " + component);
    mixpanel.track("Clicked " + component);

    this.setState({ componentToLoad: component });
  };

  render() {
    const { componentToLoad } = this.state;
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <Notifications />
        <Grid
          container
          direction="row"
          justify="center"
          alignItems="stretch"
          className={classes.gridContainer}
        >
          <Grid
            item
            xs={12}
            sm={2}
            md={2}
            lg={2}
            xl={2}
            className={classes.leftMenu}
          >
            <Grid
              container
              direction="column"
              justify="center"
              alignItems="stretch"
            >
              <span className={classes.backButton}>
                <img
                  src={Images.logoTextWhite}
                  alt="product logo"
                  className={classes.logo}
                ></img>
              </span>
              <div className={classes.componentsNameDiv}>
                <Link
                  to="/home"
                  onClick={() => this.setComponent("setup")}
                  className={
                    componentToLoad === "setup"
                      ? classes.selectedComponentStyle
                      : classes.unselectedComponentStyle
                  }
                  style={{ display: "flex" }}
                >
                  <HomeIcon className={classes.menuIcon} />
                  <Typography
                    className={
                      componentToLoad === "setup"
                        ? classes.selectedComponentText
                        : classes.unselectedComponentText
                    }
                  >
                    Setup
                  </Typography>
                </Link>

                <Link
                  to="/campaign"
                  onClick={() => this.setComponent("campaign")}
                  className={
                    componentToLoad === "campaign"
                      ? classes.selectedComponentStyle
                      : classes.unselectedComponentStyle
                  }
                  style={{ display: "flex" }}
                >
                  <MessageIcon className={classes.menuIcon} />
                  <Typography
                    className={
                      componentToLoad === "campaign"
                        ? classes.selectedComponentText
                        : classes.unselectedComponentText
                    }
                  >
                    Campaign
                  </Typography>
                </Link>

                <Link
                  to="/log"
                  onClick={() => this.setComponent("log")}
                  className={
                    componentToLoad === "log"
                      ? classes.selectedComponentStyle
                      : classes.unselectedComponentStyle
                  }
                  style={{ display: "flex" }}
                >
                  <ForumIcon className={classes.menuIcon} />
                  <Typography
                    className={
                      componentToLoad === "log"
                        ? classes.selectedComponentText
                        : classes.unselectedComponentText
                    }
                  >
                    Inbox
                  </Typography>
                </Link>

                <Link
                  to="/billing"
                  onClick={() => this.setComponent("billing")}
                  className={
                    componentToLoad === "billing"
                      ? classes.selectedComponentStyle
                      : classes.unselectedComponentStyle
                  }
                  style={{ display: "flex" }}
                >
                  <AccountBalanceIcon className={classes.menuIcon} />
                  <Typography
                    className={
                      componentToLoad === "billing"
                        ? classes.selectedComponentText
                        : classes.unselectedComponentText
                    }
                  >
                    Billing
                  </Typography>
                </Link>
              </div>
            </Grid>
          </Grid>
          <Grid
            item
            xs={12}
            sm={10}
            md={10}
            lg={10}
            xl={10}
            className={classes.componentHolder}
          >
            <Switch>
              <Route exact path="/home" component={Setup} />
              <Route exact path="/campaign" component={Campaign} />
              <Route exact path="/log" component={MessageLog} />
              <Route exact path="/billing" component={Billing} />
              <Route component={<div>Not found</div>} />
            </Switch>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(Home);
