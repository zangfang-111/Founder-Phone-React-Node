import React, { Component, Fragment } from "react";
import queryString from "query-string";
import { createSlackAccessToken } from "../Services/Api";
import InviteSlackMembers from "./InviteSlackMembers";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import { Button, Container, Typography } from "@material-ui/core";
import styles from "./styles/SlackCallbackStyles";
import { withStyles } from "@material-ui/styles";

const SLACK_REMOVE_APP_HELP_URL =
  "https://slack.com/help/articles/360003125231-Remove-apps-and-custom-integrations-from-your-workspace";

class SlackCallback extends Component {
  constructor(props) {
    super(props);
    this.state = {
      slackConnected: false,
      slackConnectedErrorMessage: "Loading...",
      showInviteMembersDialog: false,
      teamName: "",
      hasRespondent: false,
    };
  }

  componentDidMount() {
    const params = queryString.parse(this.props.location.search);
    const code = params.code;
    const clientId = params.state;
    createSlackAccessToken(code, clientId, (res) => {
      if (res.status === 200) {
        if (res.data.slackAlreadyAssociated) {
          this.setState({
            slackConnected: false,
            slackConnectedErrorMessage:
              "Already connected to this Slack under " +
              res.data.clientEmail +
              ". You have to uninstall it first to connect it to this account",
          });
        } else {
          this.setState({
            slackConnected: true,
            showInviteMembersDialog: true,
            teamName: res.data.teamName,
          });
        }
      }
    });
  }

  setHasRespondent = (value) => {
    this.setState({
      hasRespondent: value,
    });
  };

  handleClose = () => {
    const { showInviteMembersDialog } = this.state;

    this.setState({ showInviteMembersDialog: !showInviteMembersDialog }, () => {
      this.props.history.push({
        pathname: "/home",
        search: "?showdialog=true",
      });
    });
  };

  helpUrl = () => {
    window.open(SLACK_REMOVE_APP_HELP_URL, "_blank");
  };

  goHome = () => {
    this.props.history.push({ pathname: "/home" });
  };

  render() {
    const { showInviteMembersDialog, teamName, hasRespondent } = this.state;
    const { slackConnected, slackConnectedErrorMessage } = this.state;
    const { classes } = this.props;

    if (!slackConnected) {
      return (
        <Container maxWidth="lg" className={classes.container}>
          <div className={classes.main}>
            <Typography variant="h4" gutterBottom className={classes.title}>
              {slackConnectedErrorMessage}
            </Typography>

            {slackConnectedErrorMessage !== "Loading..." && (
              <Fragment>
                <div className={classes.helpURL}>
                  <Button
                    onClick={this.helpUrl}
                    variant="contained"
                    color="primary"
                    style={{ margin: "auto" }}
                  >
                    Remove previous installation
                  </Button>
                </div>
                <div className={classes.marginTop20}>
                  <Button onClick={this.goHome}>Go back</Button>
                </div>
              </Fragment>
            )}
          </div>
        </Container>
      );
    }

    return (
      <Dialog
        open={showInviteMembersDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth
      >
        <DialogContent style={{ padding: 0 }}>
          <InviteSlackMembers
            message={
              "Enter the Slack emails for team members who should see texts to FounderPhone. These users will be invited to every channel by default. Just type in the email and hit add"
            }
            header={"Connected to the " + teamName + " Slack team!"}
            setHasRespondent={this.setHasRespondent}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={this.handleClose}
            variant="contained"
            color="primary"
            disabled={!hasRespondent}
            style={{ margin: "auto", marginBottom: 20 }}
          >
            I'M DONE
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withStyles(styles)(SlackCallback);
