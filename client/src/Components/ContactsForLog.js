import React, { Component, Fragment } from "react";
import { Typography, Paper, Grid } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import styles from "./styles/ContactsForLogsStyles";
import SearchBar from "material-ui-search-bar";
import { parsePhoneNumberFromString } from "libphonenumber-js";

class ContactsForLogs extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    //Created new component because of handling phonemapping along with contacts
    const { classes, selectedContactIndex, contacts, searchQuery } = this.props;

    return (
      <Fragment>
        <Paper
          className={[
            classes.marginTop10,
            classes.paper,
            classes.height100,
          ].join(" ")}
        >
          <Grid
            container
            direction="row"
            justify="flex-start"
            className={[classes.padding20, classes.height100].join(" ")}
          >
            <Grid
              item
              className={[
                classes.displayInline,
                classes.width100,
                classes.positionRelative,
              ].join(" ")}
            >
              <Typography variant="h6">Your contacts</Typography>
            </Grid>
            <Grid item className={classes.width100}>
              <SearchBar
                value={searchQuery}
                onChange={this.props.handleSearchInput}
                onRequestSearch={this.props.search}
                onCancelSearch={this.props.cancelSearch}
                placeholder="Search by number"
                className={classes.width100}
              />
            </Grid>

            <Grid
              item
              className={[
                classes.height80p,
                classes.width100,
                classes.overflowY,
                classes.marginTop10,
              ].join(" ")}
            >
              {contacts.map((contact, index) => {
                return (
                  <div
                    className={[
                      classes.width100,
                      classes.displayInline,
                      classes.marginTop10,
                    ].join(" ")}
                    style={{
                      background:
                        index === selectedContactIndex ? "#fafafa" : "#FFF",
                      borderRadius: 10,
                    }}
                    key={index}
                  >
                    <div
                      className={classes.contactStyle}
                      onClick={() => this.props.getLogs(index)}
                    >
                      <Typography
                        variant="body1"
                        className={[classes.width100, classes.fontSize14].join(
                          " "
                        )}
                      >
                        {parsePhoneNumberFromString(
                          contact.contact
                            ? contact.contact.phoneNumber
                            : contact.contactName
                        ).formatInternational()}
                      </Typography>
                      <Typography
                        variant="body2"
                        className={[classes.textStyle, classes.width100].join(
                          " "
                        )}
                      >
                        {contact.contact
                          ? contact.contact.firstName +
                            " " +
                            contact.contact.lastName
                          : contact.contactName}
                      </Typography>
                    </div>
                  </div>
                );
              })}
            </Grid>
          </Grid>
        </Paper>
      </Fragment>
    );
  }
}

export default withStyles(styles)(ContactsForLogs);
