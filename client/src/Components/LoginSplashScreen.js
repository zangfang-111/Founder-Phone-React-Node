import React, { Component } from "react";
import { Grid, Typography } from "@material-ui/core";
import Images from "../Themes/Images";
import styles from "./styles/LoginSplashScreenStyle";
import { withStyles } from "@material-ui/styles";

class LoginSplashScreen extends Component {
  render() {
    let { classes } = this.props;

    return (
      <div className={classes.splashContainer}>
        <Grid container direction="column" justify="center">
          <Typography variant="h4" className={classes.heading}>
            Login to receive your phone number and start texting customers
          </Typography>
          <div className={classes.splashImageContainer}>
            <img
              src={Images.textingIllustration}
              alt="login logo"
              className={classes.logo}
            />
          </div>
        </Grid>
      </div>
    );
  }
}

export default withStyles(styles)(LoginSplashScreen);
