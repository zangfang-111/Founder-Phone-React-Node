import React, { Component } from "react";
import { withStyles } from "@material-ui/styles";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Popover,
  FormControl,
  InputAdornment,
  IconButton,
  OutlinedInput,
} from "@material-ui/core";
import style from "./styles/MessageLogStyles";
import { getContactsForLogs, getLogs, replyToMessage } from "../Services/Api";
import ContactsList from "../Components/ContactsForLog";
import Header from "../Components/Header";
import Notifications, { notify } from "react-notify-toast";
import { formatForDisplayDateTime } from "../Utils/TimeUtils";
import images from "../Themes/Images";
import SendIcon from "@material-ui/icons/Send";
import clsx from "clsx";
import Picker from "emoji-picker-react";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";

class MessageLog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      contacts: [],
      logs: [],
      selectedId: "",
      selectedContactName: "",
      selectedContactIndex: 0,
      searchQuery: "",
      message: "",
      displayEmojisPopup: false,
    };
  }

  componentDidMount = () => {
    this.hideOtherChatWidgets();
    this.getContacts();
  };

  getContacts = () => {
    getContactsForLogs(this.state.searchQuery, (res) => {
      if (res.status === 200) {
        this.setState({ contacts: res.data }, () => {
          if (res.data.length > 0) this.getLogsFn(0);
        });
      }
    });
  };

  getLogsFn = (index) => {
    getLogs(this.state.contacts[index].phoneMappingId, (res) => {
      if (res.status === 200) {
        this.setState({
          logs: res.data,
          selectedId: this.state.contacts[index].phoneMappingId,
          selectedContactName: this.state.contacts[index].contact
            ? this.state.contacts[index].contact.firstName
            : this.state.contacts[index].contactName,
          selectedContactIndex: index,
          message: "",
        });
      }
    });
  };

  handleSearchInput = (value) => {
    this.setState({
      searchQuery: value,
    });
  };

  search = () => {
    this.getContacts();
  };

  cancelSearch = () => {
    this.setState({ searchQuery: "" }, () => {
      this.getContacts();
    });
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  sendMessage = () => {
    const { selectedId, message, selectedContactIndex } = this.state;
    if (!message) {
      notify.show("Unable to send empty message", "error", 3000);
      return;
    }

    replyToMessage(selectedId, message, (res) => {
      if (res.status === 200) {
        notify.show("Message sent successfully", "success", 3000);
        this.getLogsFn(selectedContactIndex);
      }
      if (res.status === 400) {
        notify.show(
          "Failed to send. Please try replying from Slack",
          "error",
          3000
        );
      }
      this.setState({
        message: "",
      });
    });
  };

  hideOtherChatWidgets = () => {};

  handleEmojiClick = (event, emojiObject) => {
    let { message } = this.state;
    let newMessage = message + emojiObject.emoji;
    this.setState({ message: newMessage });
  };

  setEmptyMessage = () => {
    this.setState({ message: "" });
  };

  render() {
    const {
      contacts,
      logs,
      selectedId,
      selectedContactName,
      selectedContactIndex,
      searchQuery,
      message,
      displayEmojisPopup,
    } = this.state;
    let { classes } = this.props;

    return (
      <Container className={[classes.container].join(" ")}>
        <Header />
        <Notifications />
        <Grid
          container
          direction="row"
          spacing={1}
          alignItems="center"
          className={classes.height100}
        >
          <Grid item xs={4} className={classes.height100}>
            <ContactsList
              contacts={contacts}
              getLogs={this.getLogsFn}
              openAddContactDialog={this.openAddContactDialog}
              selectedContactIndex={selectedContactIndex}
              handleSearchInput={this.handleSearchInput}
              search={this.search}
              cancelSearch={this.cancelSearch}
              searchQuery={searchQuery}
              setEmptyMessage={this.setEmptyMessage}
            />
          </Grid>
          <Grid item xs={8} className={classes.height100}>
            <Paper
              className={[
                classes.marginTop10,
                classes.height100,
                classes.paper,
              ].join(" ")}
            >
              <div id="wrapper" className={classes.mainDiv}>
                <div id="header" className={classes.headerDiv}>
                  <Typography variant="h6" style={{ margin: 20 }}>
                    Messages with {selectedContactName}
                  </Typography>
                </div>
                <div id="content" className={classes.bodyDiv}>
                  {logs.reverse().map((message, index) => {
                    return (
                      <div style={{ width: "100%" }} key={index}>
                        <div
                          style={{
                            textAlign:
                              selectedId === message.fromPhoneMapping
                                ? "left"
                                : "right",
                            margin: 10,
                            borderRadius: 10,
                            padding: 10,
                            background: "#fafafa",
                          }}
                        >
                          {selectedId !== message.fromPhoneMapping && (
                            <img
                              src={images.slackLogo}
                              alt="slacklogo"
                              className={classes.slackLogo}
                            ></img>
                          )}
                          {selectedId === message.fromPhoneMapping &&
                            message.isCall && (
                              <img
                                src={images.calledImage}
                                alt="calledImage"
                                className={classes.calledImage}
                              ></img>
                            )}
                          <div style={{ marginTop: 10 }}>
                            {selectedId === message.fromPhoneMapping
                              ? selectedContactName
                              : "Me"}
                          </div>
                          <div className={classes.dateDiv}>
                            {formatForDisplayDateTime(message.createdOn)}
                          </div>
                          <div style={{ marginTop: 10, marginBottom: 10 }}>
                            {message.isCall
                              ? "Had a call on " +
                                formatForDisplayDateTime(message.createdOn)
                              : message.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div id="footer" className={classes.footerDiv}>
                  <FormControl
                    className={clsx(
                      classes.margin,
                      classes.textField,
                      classes.width100
                    )}
                    variant="outlined"
                    style={{
                      margin: "20px 0 0 11px",
                      width: "96%",
                    }}
                  >
                    <OutlinedInput
                      id="filled-adornment-password"
                      value={message}
                      name="message"
                      onChange={this.handleChange}
                      onKeyUp={(event) => {
                        if (event.key === "Enter") {
                          this.sendMessage();
                        }
                      }}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => {
                              this.setState({ displayEmojisPopup: true });
                            }}
                            edge="end"
                            ref="emojis"
                          >
                            <EmojiEmotionsIcon />
                          </IconButton>

                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={this.sendMessage}
                            edge="end"
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </FormControl>
                </div>
              </div>
            </Paper>
          </Grid>
        </Grid>
        <Popover
          id="color"
          open={displayEmojisPopup}
          onClose={() =>
            this.setState({
              displayEmojisPopup: false,
            })
          }
          anchorEl={this.refs.emojis}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          style={{ padding: 5, margin: 10 }}
        >
          <Picker onEmojiClick={this.handleEmojiClick} />
        </Popover>
      </Container>
    );
  }
}

export default withStyles(style)(MessageLog);
