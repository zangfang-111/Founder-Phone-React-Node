import React, { Component, Fragment } from "react";
import { withStyles } from "@material-ui/styles";
import {
  Container,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@material-ui/core";
import style from "./styles/CampaignStyle";
import Header from "../Components/Header";
import TemplateMessage from "../Components/TemplateMessage";
import Notifications, { notify } from "react-notify-toast";
import ContactsList from "../Components/ContactsList";
import { getSlackUsers, saveContact, sendIntroMessage } from "../Services/Api";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { formatPhoneNumber } from "../Utils/PhoneUtils";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import "react-phone-input-2/lib/material.css";
import PhoneInput from "react-phone-input-2";

const NOTIFICATION_LENGTH = 6000;

class Campaign extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedContacts: [],
      showConfirmationDialog: false,
      introMessage: "",
      openAddContactDialog: false,
      firstName: "",
      lastName: "",
      phoneNumber: "+1",
      email: "",
      company: "",
      accountManager: "",
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
    });
  }

  selectContact = (id) => {
    let selectedContactsCopy = this.state.selectedContacts;
    selectedContactsCopy.push(id);
    this.setState({ selectedContacts: selectedContactsCopy });
  };

  unselectContact = (id) => {
    let selectedContactsCopy = this.state.selectedContacts;
    const index = selectedContactsCopy.indexOf(id);
    if (index > -1) {
      selectedContactsCopy.splice(index, 1);
    }
    this.setState({ selectedContacts: selectedContactsCopy });
  };

  selectAllContacts = (ids) => {
    this.setState({ selectedContacts: ids });
  };

  unSelectAllContacts = () => {
    this.setState({ selectedContacts: [] });
  };

  sendAllCallback = (introMessage) => {
    let { selectedContacts } = this.state;
    if (selectedContacts.length === 0) {
      notify.show("Select at least one contact", "error", NOTIFICATION_LENGTH);
      return;
    }

    this.setState({
      introMessage: introMessage,
      showConfirmationDialog: true,
    });
  };

  sendIntroMessageToSelectedContacts = () => {
    let { selectedContacts, introMessage } = this.state;

    sendIntroMessage(introMessage, selectedContacts, (res) => {
      if (res.status === 200) {
        notify.show(res.data.message, "success", NOTIFICATION_LENGTH);
        this.setState({
          selectedContacts: [],
        });
      }
    });
  };

  openAddContactDialog = () => {
    this.setState({ openAddContactDialog: !this.state.openAddContactDialog });
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handlePhoneNumberChange = (value) => {
    this.setState({ phoneNumber: value });
  };

  saveContactFn = () => {
    const {
      firstName,
      lastName,
      phoneNumber,
      accountManager,
      email,
      company,
      openAddContactDialog,
    } = this.state;
    if (!firstName) {
      notify.show("Please enter first name", "error", 3000);
      return;
    }
    if (!phoneNumber.length > 2) {
      notify.show("Please enter phone number", "error", 3000);
      return;
    }

    let parsedPhoneNumber = parsePhoneNumberFromString(
      formatPhoneNumber(phoneNumber)
    );

    if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
      notify.show("Please enter valid phone number", "error", 3000);
      return;
    }
    saveContact(
      firstName,
      lastName,
      parsedPhoneNumber.number,
      email,
      company,
      accountManager,
      (res) => {
        if (res.status === 200) {
          notify.show("Contact saved successfully", "success", 3000);
        }
        if (res.status === 400) {
          notify.show("Contact already exists", "error", 3000);
        }

        this.setState({
          openAddContactDialog: !openAddContactDialog,
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          company: "",
          accountManager: "",
        });
      }
    );
  };

  render() {
    const {
      selectedContacts,
      showConfirmationDialog,
      firstName,
      lastName,
      phoneNumber,
      accountManager,
      slackUsers,
      email,
      company,
      openAddContactDialog,
    } = this.state;
    let { classes } = this.props;

    return (
      <Fragment>
        <Container maxWidth="lg" className={classes.container}>
          <Header />
          <Notifications />
          <Grid container direction="row" spacing={2}>
            <Grid item xs={4}>
              <ContactsList
                selectedContacts={selectedContacts}
                selectContact={this.selectContact}
                unselectContact={this.unselectContact}
                selectAllContacts={this.selectAllContacts}
                unSelectAllContacts={this.unSelectAllContacts}
                openAddContactDialog={this.openAddContactDialog}
                componentLoaded="campaign"
              />
            </Grid>
            <Grid item xs={8}>
              <TemplateMessage sendAllCallback={this.sendAllCallback} />
            </Grid>
          </Grid>
        </Container>
        <Dialog
          open={showConfirmationDialog}
          className={classes.margin10}
          onClose={() => {
            this.setState({ showConfirmationDialog: !showConfirmationDialog });
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Are you sure?</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              We'll send this message to {selectedContacts.length} contact(s)
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                this.setState({
                  showConfirmationDialog: !showConfirmationDialog,
                });
              }}
              variant="contained"
              color="default"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.setState({
                  showConfirmationDialog: !showConfirmationDialog,
                });
                this.sendIntroMessageToSelectedContacts();
              }}
              variant="contained"
              color="primary"
            >
              Send
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openAddContactDialog}
          className={classes.margin10}
          onClose={() => {
            this.setState({ openAddContactDialog: !openAddContactDialog });
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Add contact</DialogTitle>
          <DialogContent>
            <div style={{ display: "inline-flex" }}>
              <TextField
                required
                value={firstName}
                name="firstName"
                id="first name"
                label="First Name"
                variant="outlined"
                onChange={this.handleChange}
                style={{ margin: 10 }}
              />
              <TextField
                value={lastName}
                name="lastName"
                id="last name"
                label="Last Name"
                variant="outlined"
                onChange={this.handleChange}
                style={{ margin: 10 }}
              />
            </div>
            <div
              style={{ display: "inline-flex" }}
              className={classes.phoneNumber}
            >
              <PhoneInput
                value={phoneNumber}
                name="phoneNumber"
                id="Phone Number"
                label="Phone Number"
                onChange={this.handlePhoneNumberChange}
                variant="outlined"
                style={{ margin: 10 }}
                enableSearch
                country={"us"}
              />
              <TextField
                value={email}
                name="email"
                id="Email"
                label="Email"
                variant="outlined"
                onChange={this.handleChange}
                style={{ margin: 10 }}
              />
            </div>
            <div>
              <TextField
                value={company}
                name="company"
                id="Company"
                label="Company"
                variant="outlined"
                onChange={this.handleChange}
                style={{ margin: 10, width: "47%" }}
              />
            </div>

            <div className={classes.accountManagerFormControlWrapper}>
              <FormControl
                variant="outlined"
                className={classes.accountManagerFormControl}
              >
                <InputLabel id="demo-simple-select-outlined-label">
                  Account Manager
                </InputLabel>
                <Select
                  labelId="demo-simple-select-outlined-label"
                  id="demo-simple-select-outlined"
                  value={accountManager}
                  onChange={this.handleChange}
                  style={{ width: "100%" }}
                  name="accountManager"
                  labelWidth={140}
                >
                  {slackUsers.map((user) => (
                    <MenuItem
                      key={user.profile.email}
                      value={user.profile.email}
                    >
                      {user.profile.real_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                this.setState({
                  openAddContactDialog: !openAddContactDialog,
                });
              }}
              variant="contained"
              color="default"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.saveContactFn();
              }}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Fragment>
    );
  }
}

export default withStyles(style)(Campaign);
