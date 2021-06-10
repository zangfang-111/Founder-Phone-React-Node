import React, { Component } from "react";
import { Button, Container, Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import { withRouter } from "react-router";
import styles from "./styles/Page404Style";

class Page404 extends Component {
  goBack = () => {
    this.props.history.goBack();
  };

  render() {
    const { classes, errorMessage } = this.props;

    return (
      <Container maxWidth="lg" className={classes.container}>
        <div className={classes.main}>
          <Typography variant="h2" gutterBottom className={classes.title}>
            {errorMessage}
          </Typography>
          <Button onClick={this.goBack}>GO BACK</Button>
        </div>
      </Container>
    );
  }
}

export default withRouter(withStyles(styles)(Page404));
