import React, { Component } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import ProtectedRoute from "./Components/ProtectedRoute";
import Login from "./Containers/Login";
import Home from "./Containers/Home";
import HubspotCallback from "./Components/HubspotCallback";
import SlackCallback from "./Components/SlackCallback";
import firebase from "firebase/app";
import colors from "./Themes/Colors";
import ReactGA from "react-ga";
import * as Sentry from "@sentry/browser";
import mixpanel from "mixpanel-browser";
import GoogleCallback from "./Components/GoogleCallback";

let GOOGLE_ANALYTICS_ID = process.env.REACT_APP_GOOGLE_ANALYTICS_ID;
let MIXPANEL_ID = process.env.REACT_APP_MIXPANEL_ID;
let SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

ReactGA.initialize(GOOGLE_ANALYTICS_ID);
mixpanel.init(MIXPANEL_ID);
Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.REACT_APP_NODE_ENV
});

const theme = createMuiTheme({
  typography: {
    fontFamily: ["Poppins", "sans-serif"].join(","),
  },
  palette: {
    secondary: {
      main: colors.secondary,
    },
    primary: {
      main: colors.primary,
    },
  },
});

class Root extends Component {
  constructor() {
    super();
    this.state = {
      authenticated: false,
      firebaseListenerRegistered: false,
    };
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          firebaseListenerRegistered: true,
          authenticated: true,
        });
      } else {
        this.setState({
          firebaseListenerRegistered: true,
          authenticated: false,
        });
      }
    });
  }

  render() {
    if (!this.state.firebaseListenerRegistered) {
      return <div></div>;
    } else {
      return (
        <MuiThemeProvider theme={theme}>
          <BrowserRouter>
            <Switch>
              <Route exact path="/login" component={Login} />
              <ProtectedRoute
                path="/slackcallback"
                exact
                component={SlackCallback}
              />
              <ProtectedRoute
                exact
                path="/hubspotcallback"
                component={HubspotCallback}
              />
              <ProtectedRoute
                path="/googlecallback"
                exact
                component={GoogleCallback}
              />
              <Route component={Home} />
            </Switch>
          </BrowserRouter>
        </MuiThemeProvider>
      );
    }
  }
}

export default Root;
