import React, { Component } from "react";
import {
  addDefaultRespondents,
  getDefaultRespondents,
  getSlackUsers,
} from "../Services/Api";
import Notifications, { notify } from "react-notify-toast";
import { withRouter } from "react-router";
import styles from "./styles/InviteSlackMembersStyles";
import { withStyles } from "@material-ui/styles";
import {
  Button,
  Container,
  Grid,
  Typography,
  TextField,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { planTypes } from "../Utils/Types";

const NOTIFICATION_LENGTH = 6000;

class InviteSlackMembers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openInviteDialog: true,
      userEmails: [],
      defaultRespondents: [],
      slackUsers: [],
    };
  }

  componentDidMount() {
    getSlackUsers().then((res) => {
      const users = res.data.users.filter(
        (u) => !u.deleted && !!u.profile.email
      );
      this.setState({
        slackUsers: users,
      });

      getDefaultRespondents((res) => {
        if (res.status === 200) {
          this.setState({
            defaultRespondents: users.filter((u) =>
              res.data.defaultRespondents.find((dr) => dr === u.profile.email)
            ),
            currentPlan: res.data.currentPlan,
            teamName: res.data.teamName,
          });
        }
      });
    });
  }

  addDefaultRespondentsFn = () => {
    const newUsers = this.state.slackUsers.filter((u) =>
      this.state.defaultRespondents.find(
        (dr) => dr.profile.email === u.profile.email
      )
    );
    if (newUsers.length > 0) {
      addDefaultRespondents(
        newUsers.map((u) => u.profile.email),
        (res) => {
          if (res.status === 200) {
            this.setState({
              defaultRespondents: newUsers,
            });
            this.props.setHasRespondent && this.props.setHasRespondent(true);
            notify.show(
              "Great! The emails you added will be invited to channels from new numbers",
              "success",
              NOTIFICATION_LENGTH
            );
          }

          if (res.status === 400) {
            notify.show(
              "Doesn't look like the emails you used belong to this Slack workspace. Double check which emails they're using in Slack from the Slack admin panel",
              "error",
              NOTIFICATION_LENGTH
            );
          }
        }
      );
    }
  };

  render() {
    const { classes } = this.props;

    const {
      defaultRespondents,
      currentPlan,
      teamName,
      slackUsers,
    } = this.state;

    return (
      <Container className={classes.container}>
        <Notifications />
        <Grid
          container
          className={[classes.padding20, classes.width100].join(" ")}
        >
          <Grid item className={classes.width100}>
            <Typography variant="subtitle2" className={classes.headerStyle}>
              {this.props.header}
            </Typography>

            <Typography
              variant="subtitle2"
              className={[
                classes.marginTop10,
                classes.textStyle,
                classes.padding10,
              ].join(" ")}
            >
              {this.props.message}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            {(currentPlan === planTypes.PAID ||
              currentPlan === planTypes.TRIAL) &&
            teamName ? (
              <Grid container item xs={12} direction="row-reverse">
                <Grid item container xs={12} className={classes.marginTop15}>
                  <Grid item xs={7}>
                    <Autocomplete
                      multiple
                      options={slackUsers}
                      getOptionLabel={(user) => user.profile.email}
                      defaultValue={defaultRespondents}
                      onChange={(e, values) => {
                        this.setState({
                          defaultRespondents: values,
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder="richard@piedpiper.com"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.addDefaultRespondentsFn}
                      style={{ marginLeft: 30 }}
                      disabled={!defaultRespondents.length}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              <div></div>
            )}
          </Grid>
        </Grid>
      </Container>
    );
  }
}

export default withRouter(withStyles(styles)(InviteSlackMembers));
