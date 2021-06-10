import React, { Component } from "react";
import { withStyles } from "@material-ui/styles";
import { Grid, Button, Typography } from "@material-ui/core";
import firebase from "firebase/app";
import styles from "./styles/HeaderStyle";
import { withRouter } from "react-router";

class Header extends Component {
  signOutUser = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        this.props.history.push("/login");
      });
  };

  render() {
    let { classes } = this.props;
    return (
      <Grid
        container
        direction="column"
        justify="space-around"
        className={classes.headerContainer}
      >
        <Grid item container justify="flex-end">
          <Button className={classes.padding10} onClick={this.signOutUser}>
            Logout
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h5">{this.props.title}</Typography>
        </Grid>
      </Grid>
    );
  }
}

export default withRouter(withStyles(styles)(Header));
