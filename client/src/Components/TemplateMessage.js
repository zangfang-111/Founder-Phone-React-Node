import React, { Component, Fragment } from "react";
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  DialogContentText,
  CircularProgress,
} from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withStyles } from "@material-ui/styles";
import styles from "./styles/TemplateMessageStyle";
import { notify } from "react-notify-toast";
import { Parser } from "html-to-react";
import {
  deleteSavedTemplate,
  getAllSavedTemplates,
  saveCampaignTemplate,
} from "../Services/Api";
import DeleteIcon from "@material-ui/icons/Delete";

const INTRO_MESSAGE_MAX_LENGTH = 300;
const PREVIEW_FIRST_NAME = "John";
const PREVIEW_LAST_NAME = "Doe";
const PREVIEW_COMPANY = "Hooli";
let htmlToReactParser = new Parser();

class TemplateMessage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      introMessage: "",
      previewText: "",
      templateName: "",
      openTemplateNameDialog: false,
      showTemplateNameError: false,
      loadingTemplates: true,
      savedTemplates: [],
      deleteSavedTemplateEntity: null,
      showTemplateDeleteDialog: false,
    };
  }

  componentDidMount() {
    this.loadSavedTemplates();
  }

  loadSavedTemplates = () => {
    getAllSavedTemplates((res) => {
      if (res.status === 200) {
        this.setState({ loadingTemplates: false, savedTemplates: res.data });
      }
    });
  };

  handleIntroMessageChange = (event) => {
    if (event.target.value.length <= INTRO_MESSAGE_MAX_LENGTH) {
      let enteredText = event.target.value;
      enteredText = enteredText.replace(
        /{firstname}/g,
        `<span style="color: #e57373">${PREVIEW_FIRST_NAME}</span>`
      );
      enteredText = enteredText.replace(
        /{lastname}/g,
        `<span style="color: #e57373">${PREVIEW_LAST_NAME}</span>`
      );
      enteredText = enteredText.replace(
        /{company}/g,
        `<span style="color: #e57373">${PREVIEW_COMPANY}</span>`
      );
      enteredText = enteredText.replace(/\n/g, "<br />");
      this.setState({
        [event.target.name]: event.target.value,
        previewText: enteredText,
      });
    }
  };

  handleTextChange = (event) => {
    let enteredText = event.target.value;

    if (enteredText.length === 1) {
      enteredText = enteredText.toUpperCase();
    }

    this.setState({ [event.target.name]: enteredText });
  };

  sendToAllClicked = () => {
    let { introMessage } = this.state;
    if (introMessage.trim().length === 0) {
      notify.show("You need to enter a message to send!", "error", 3000);
      return;
    }

    this.props.sendAllCallback(introMessage);
  };

  saveMessageTemplateClicked = () => {
    let { introMessage } = this.state;
    if (introMessage.trim().length === 0) {
      notify.show(
        "You need to enter a message to save it as template!",
        "error",
        3000
      );
      return;
    }

    this.toggleTemplateNameDialog();
    // show a dialog to get the template name
  };

  saveMessageTemplate = () => {
    let { introMessage, templateName } = this.state;
    saveCampaignTemplate(templateName, introMessage, (res) => {
      if (res.status === 200) {
        notify.show("Template saved", "success", 3000);
        this.setState({ templateName: "" });
        this.loadSavedTemplates();
      } else if (res.status === 400) {
        notify.show(res.data, "error", 3000);
      } else {
        notify.show(
          "Unable to save your template at the moment. Please try again later"
        );
      }
    });
  };

  handleTemplateName = () => {
    let { templateName } = this.state;
    if (!templateName.trim()) {
      this.setState({
        showTemplateNameError: true,
      });
      return;
    }
    this.toggleTemplateNameDialog();
    this.saveMessageTemplate();
  };

  toggleTemplateNameDialog = () => {
    this.setState((prevState, props) => ({
      openTemplateNameDialog: !prevState.openTemplateNameDialog,
      showTemplateNameError: false,
    }));
  };

  handleTemplateDelete = (event, templateIndex) => {
    event.stopPropagation();
    let { savedTemplates } = this.state;
    let selected = savedTemplates[templateIndex];

    this.setState({
      showTemplateDeleteDialog: true,
      deleteSavedTemplateEntity: selected,
    });
  };

  deleteSelectedMessageTemplate = () => {
    let { deleteSavedTemplateEntity } = this.state;
    this.toggleErrorDeleteDialog();
    deleteSavedTemplate(deleteSavedTemplateEntity._id, (res) => {
      if (res.status === 200) {
        notify.show(
          `Template - ${deleteSavedTemplateEntity.templateName} deleted`,
          "success",
          3000
        );
        this.setState({
          deleteSavedTemplateEntity: null,
        });
        this.loadSavedTemplates();
      } else {
        notify.show("Unable to delete the template. Please try again later");
      }
    });
  };

  handleTemplateSelection = (templateIndex) => {
    let { savedTemplates } = this.state;
    let selected = savedTemplates[templateIndex];
    if (selected) {
      this.setState({
        introMessage: selected.templateMessage,
      });
    }
  };

  toggleErrorDeleteDialog = () => {
    this.setState((prevState, props) => ({
      showTemplateDeleteDialog: !prevState.showTemplateDeleteDialog,
      deleteSavedTemplateEntity: null,
    }));
  };

  render() {
    let { classes } = this.props;
    let {
      introMessage,
      previewText,
      templateName,
      openTemplateNameDialog,
      showTemplateNameError,
      loadingTemplates,
      savedTemplates,
      showTemplateDeleteDialog,
      deleteSavedTemplateEntity,
    } = this.state;
    return (
      <Fragment>
        <Grid item className={classes.marginBottom30}>
          <Paper
            className={[
              classes.marginTop10,
              classes.width100,
              classes.paper,
            ].join(" ")}
          >
            <Grid
              container
              className={[classes.padding20, classes.width100].join(" ")}
            >
              <Grid item className={classes.width100}>
                <Typography variant="subtitle2" className={classes.headerStyle}>
                  Send a first text to your customers
                </Typography>
                <Typography
                  variant="subtitle2"
                  className={[
                    classes.marginTop10,
                    classes.textStyle,
                    classes.padding10,
                  ].join(" ")}
                >
                  We'll only create a channel in your Slack once they respond.
                  Use &#123;firstname&#125; and &#123;lastname&#125; in your
                  message and we'll replace them with your contact's actual
                  names where available
                </Typography>
                <Fragment>
                  <Grid
                    container
                    direction="column"
                    className={classes.padding10}
                  >
                    <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                      <TextField
                        id="outlined-dense"
                        className={[
                          // clsx(classes.textField, classes.dense)
                        ].join(" ")}
                        multiline
                        rows="5"
                        name="introMessage"
                        fullWidth
                        variant="outlined"
                        value={introMessage}
                        onChange={this.handleIntroMessageChange}
                        placeholder="Hi {firstname}! This is Rohit from FounderPhone. You're an important customer to us. Here's my number. Text me when you need anything and I'll handle it personally or assign it to the right member of my team"
                      />
                      <Typography
                        variant="body1"
                        className={classes.introMessageCounter}
                      >
                        {introMessage.length}/{INTRO_MESSAGE_MAX_LENGTH}
                      </Typography>

                      <Fragment>
                        <Typography
                          variant="subtitle2"
                          style={{ paddingTop: 10 }}
                        >
                          Preview
                        </Typography>

                        <Typography
                          variant="subtitle1"
                          style={{ paddingTop: 10, paddingBottom: 10 }}
                        >
                          {previewText.length > 0
                            ? htmlToReactParser.parse(previewText)
                            : "Enter a message to see a preview. Use {firstname} and {lastname} to use your contact's names or {company} for their company. You'll see John Doe from Hooli in the preview"}
                        </Typography>
                      </Fragment>
                    </Grid>
                    <Grid item container direction="row" xs={12}>
                      <Grid item xs={4}>
                        <Button
                          variant="text"
                          color="primary"
                          onClick={this.saveMessageTemplateClicked}
                          style={{ paddingLeft: 0 }}
                        >
                          SAVE AS TEMPLATE
                        </Button>
                      </Grid>
                      <Grid item xs={4} style={{ textAlign: "center" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={this.sendToAllClicked}
                        >
                          Send to all
                        </Button>
                      </Grid>
                      <Grid item xs={4}></Grid>
                    </Grid>
                  </Grid>
                </Fragment>
              </Grid>
            </Grid>
          </Paper>
          <Paper
            className={[
              classes.marginTop10,
              classes.width100,
              classes.paper,
            ].join(" ")}
          >
            <Grid
              container
              className={[classes.padding20, classes.width100].join(" ")}
            >
              <Grid item className={classes.width100}>
                <Typography variant="subtitle2" className={classes.headerStyle}>
                  Saved templates
                </Typography>
                {loadingTemplates === false && savedTemplates.length === 0 && (
                  <Typography
                    variant="subtitle2"
                    className={classes.noSavedTemplates}
                  >
                    You have no saved templates
                  </Typography>
                )}

                {loadingTemplates === true && (
                  <div className={classes.progressStyle}>
                    <CircularProgress color="primary" />
                  </div>
                )}

                <Grid
                  item
                  xs={12}
                  container
                  direction="column"
                  className={classes.savedTemplateContainer}
                >
                  {savedTemplates.map((savedTemplate, index) => {
                    return (
                      <Grid item xs={5} key={savedTemplate._id}>
                        <div
                          className={classes.savedTemplateItem}
                          onClick={() => this.handleTemplateSelection(index)}
                        >
                          <div>{savedTemplate.templateName}</div>
                          <DeleteIcon
                            onClick={(event) =>
                              this.handleTemplateDelete(event, index)
                            }
                          />
                        </div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Dialog
          open={openTemplateNameDialog}
          className={classes.margin10}
          onClose={() => {
            this.toggleTemplateNameDialog();
          }}
          fullWidth={true}
          maxWidth={"xs"}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Add Template</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="templateName"
              label="Template name"
              name="templateName"
              type="text"
              fullWidth
              onChange={this.handleTextChange}
              value={templateName}
            />
            {showTemplateNameError && (
              <Typography color="primary">
                Please enter template name
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                this.toggleTemplateNameDialog();
              }}
              variant="text"
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.handleTemplateName();
              }}
              className={classes.marginRight15}
              variant="contained"
              color="primary"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showTemplateDeleteDialog}
          className={classes.margin10}
          onClose={() => {
            this.toggleErrorDeleteDialog();
          }}
          fullWidth={true}
          maxWidth={"xs"}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Confirmation</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Sure to delete the template -
              {deleteSavedTemplateEntity
                ? deleteSavedTemplateEntity.templateName
                : ""}{" "}
              ?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                this.toggleErrorDeleteDialog();
              }}
              variant="text"
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                this.deleteSelectedMessageTemplate();
              }}
              className={classes.marginRight15}
              variant="contained"
              color="primary"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Fragment>
    );
  }
}

export default withStyles(styles)(TemplateMessage);
