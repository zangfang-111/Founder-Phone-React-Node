import React, { Component } from "react";
import queryString from "query-string";
import { createHubSpotAccessToken } from "../Services/Api";
import styles from "./styles/HubpotCallbackStyles";
import { withStyles } from "@material-ui/styles";
import { Container, Typography } from "@material-ui/core";

class HubspotCallback extends Component {
  constructor(props) {
    super(props);
    this.state = {
      success: false,
      message:
        "Please wait we pull contacts from HubSpot. You will be automatically redirected",
    };
  }

  componentDidMount() {
    const params = queryString.parse(this.props.location.search);
    const code = params.code;
    createHubSpotAccessToken(code, (res) => {
      if (res.status === 200) {
        this.props.history.push({
          pathname: "/home",
        });
      }
    });
  }

  pushToHome = () => {
    this.props.history.push({
      pathname: "/home",
      search: "?hubspotconnected=true",
    });
  };

  render() {
    let { message } = this.state;
    let { classes } = this.props;

    return (
      <Container maxWidth="lg" className={classes.container}>
        <div className={classes.main}>
          <Typography variant="h4" gutterBottom className={classes.title}>
            {message}
          </Typography>
        </div>
      </Container>
    );
  }
}

export default withStyles(styles)(HubspotCallback);
