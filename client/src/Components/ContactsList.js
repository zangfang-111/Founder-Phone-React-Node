import React, { Component, Fragment } from "react";
import {
  Typography,
  Paper,
  Grid,
  Checkbox,
  Popover,
  Button,
} from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import styles from "./styles/ContactsListStyles";
import { deleteContact, getContacts, googleSaveContact } from "../Services/Api";
import { notify } from "react-notify-toast";
import SearchBar from "material-ui-search-bar";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import GoogleContact from "react-google-contacts";

const NOTIFICATION_LENGTH = 6000;

class ContactsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contacts: [],
      searchQuery: "",
      displayDeletePopUp: false,
      selectedMoreIcon: -1,
    };
  }

  componentDidMount = () => {
    this.getContactsFn();
  };

  responseCallback = (response) => {
    this.saveAllContact(response);
  };

  getContactsFn = () => {
    getContacts(this.state.searchQuery, (res) => {
      if (res.status === 200) {
        this.setState({ contacts: res.data });
      }
      if (res.status === 400 || res.status === 404) {
        notify.show(
          "Couldn't search contacts :-(",
          "error",
          NOTIFICATION_LENGTH
        );
      }
    });
  };

  handleSearchInput = (value) => {
    this.setState({
      searchQuery: value,
    });
  };

  search = () => {
    this.getContactsFn();
  };

  cancelSearch = () => {
    this.setState({ searchQuery: "" }, () => {
      this.getContactsFn();
    });
  };

  selectContact = (event, index) => {
    if (event.target.checked) {
      this.selectedContact(this.state.contacts[index]);
    } else {
      this.unselectContact(this.state.contacts[index]);
    }
  };

  handleSelectAllContacts = (event) => {
    if (event.target.checked) {
      this.selectAllContacts();
    } else {
      this.unselectAllContacts();
    }
  };

  selectAllContacts = () => {
    const { contacts } = this.state;
    let contactIds = contacts.map((contact) => contact._id);
    this.props.selectAllContacts(contactIds);
  };

  unselectAllContacts = () => {
    this.props.unSelectAllContacts();
  };

  selectedContact = (contact) => {
    this.props.selectContact(contact._id);
  };

  unselectContact = (contact) => {
    this.props.unselectContact(contact._id);
  };

  deleteContactFn = () => {
    const { selectedMoreIcon, contacts } = this.state;

    deleteContact(contacts[selectedMoreIcon]._id, (res) => {
      if (res.status === 200) {
        notify.show("Deleted successfully", "success", 3000);
        let contactsCopy = contacts;
        contactsCopy.splice(selectedMoreIcon, 1);
        this.setState({ selectedMoreIcon: -1, contacts: contactsCopy });
      }
    });
  };

  saveAllContact = (gContact) => {
    let numbers = [];

    gContact.forEach((element) => {
      if (element.phoneNumber) {
        let data = {
          email: element.email,
          firstName: element.familyName,
          lastName: element.givenName,
          phoneNumber: element.phoneNumber,
        };
        numbers.push(data);
      }
    });

    const body = {
      contacts: numbers,
    };

    googleSaveContact(body, (res) => {
      if (res.status === 200) {
        notify.show("Contacts saved successfully", "success", 3000);
        this.getContactsFn();
      }
      if (res.status === 400) {
        notify.show("Please try again", "error", 3000);
      }
      if (res.status === 404) {
        notify.show("Something went wrong", "error", 3000);
      }
    });
  };

  render() {
    const {
      searchQuery,
      contacts,
      displayDeletePopUp,
      selectedMoreIcon,
    } = this.state;
    const { classes, selectedContacts } = this.props;

    let GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    return (
      <Fragment>
        <Paper
          className={[
            classes.marginTop10,
            classes.paper,
            classes.height80,
          ].join(" ")}
        >
          <Grid
            container
            direction="row"
            justify="flex-start"
            className={[classes.padding25, classes.height100].join(" ")}
          >
            <Grid
              item
              className={[
                classes.displayInline,
                classes.width100,
                classes.positionRelative,
              ].join(" ")}
            >
              <Typography variant="subtitle2" className={classes.headerStyle}>
                Your contacts
              </Typography>
            </Grid>
            <Grid item className={classes.width100}>
              <SearchBar
                value={searchQuery}
                onChange={this.handleSearchInput}
                onRequestSearch={this.search}
                onCancelSearch={this.cancelSearch}
                placeholder="Search by name or number"
                className={classes.width100}
              />
            </Grid>

            <Grid
              item
              className={[classes.width100, classes.addContact].join(" ")}
            >
              <PersonAddIcon />
              <div
                onClick={this.props.openAddContactDialog}
                className={classes.addContactDiv}
              >
                Add contact
              </div>
              <div>
                <GoogleContact
                  clientId={GOOGLE_CLIENT_ID}
                  render={(renderProps) => (
                    <Button
                      onClick={renderProps.onClick}
                      className={classes.addContactDiv}
                    >
                      <PersonAddIcon />
                      Add Google Contact
                    </Button>
                  )}
                  buttonText="Import"
                  onSuccess={this.responseCallback}
                ></GoogleContact>
              </div>
            </Grid>

            <Grid item className={classes.width100}>
              <Typography
                variant="subtitle2"
                className={[
                  classes.textStyle,
                  classes.padding10,
                  classes.textAlignCenter,
                ].join(" ")}
              >
                {selectedContacts.length} contact(s) selected
              </Typography>
            </Grid>

            <Grid item className={[classes.width100].join(" ")}>
              <div
                className={[
                  classes.width100,
                  classes.displayInline,
                  classes.marginTop10,
                ].join(" ")}
              >
                <div style={{ width: "80%" }}>
                  <Typography className={classes.subHeaderStyle}>
                    Contact
                  </Typography>
                </div>
                <div className={classes.width20} style={{ marginLeft: -42 }}>
                  <Checkbox
                    checked={selectedContacts.length === contacts.length}
                    color="primary"
                    inputProps={{ "aria-label": "secondary checkbox" }}
                    onChange={this.handleSelectAllContacts}
                  />
                </div>
              </div>
            </Grid>

            <Grid
              item
              className={[
                classes.height50,
                classes.width100,
                classes.overflowY,
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
                    key={index}
                  >
                    <div style={{ width: "80%" }}>
                      <Typography
                        variant="body1"
                        className={[classes.width100, classes.fontSize14].join(
                          " "
                        )}
                      >
                        {parsePhoneNumberFromString(
                          contact.phoneNumber
                        ).formatInternational()}
                      </Typography>
                      <Typography
                        variant="body2"
                        className={[classes.textStyle, classes.width100].join(
                          " "
                        )}
                      >
                        {contact.firstName} {contact.lastName}
                      </Typography>
                    </div>
                    <div className={classes.width20}>
                      <Checkbox
                        checked={selectedContacts.indexOf(contact._id) > -1}
                        color="primary"
                        inputProps={{ "aria-label": "secondary checkbox" }}
                        onChange={(event) => this.selectContact(event, index)}
                      />
                    </div>
                    <div className={classes.width20}>
                      <MoreVertIcon
                        ref={index}
                        onClick={() =>
                          this.setState({
                            displayDeletePopUp: true,
                            selectedMoreIcon: index,
                          })
                        }
                        style={{ cursor: "pointer", height: "100%" }}
                      />
                      <Popover
                        id="color"
                        open={displayDeletePopUp && index === selectedMoreIcon}
                        onClose={() =>
                          this.setState({
                            displayDeletePopUp: false,
                          })
                        }
                        anchorEl={this.refs[index]}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "center",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "center",
                        }}
                        style={{ padding: 5 }}
                      >
                        <div
                          style={{ padding: 10, cursor: "pointer" }}
                          onClick={this.deleteContactFn}
                        >
                          Delete
                        </div>
                      </Popover>
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

export default withStyles(styles)(ContactsList);
