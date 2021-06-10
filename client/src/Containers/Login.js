import React from "react";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/styles";
import Images from "../Themes/Images";
import firebase from "firebase/app";
import "firebase/auth";
import { isValidEmail } from "../Utils/UserUtils";
import { registerUser } from "../Services/Api";
import styles from "./styles/LoginStyle";
import ReactGA from "react-ga";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import * as Sentry from "@sentry/browser";
import mixpanel from "mixpanel-browser";
import LoginSplashScreen from "../Components/LoginSplashScreen";

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: "",
      errorTitle: "",
      errorMessage: "",
      showErrorDialog: false,
      isLogin: true,
      loading: false,
      failedToConnect: false,
      redirecting: false,
    };
  }

  componentDidMount = () => {
    ReactGA.pageview("login");
    Sentry.captureMessage("Login");
    mixpanel.track("Login");

    var user = firebase.auth().currentUser;
    if (user) {
      this.setState({ redirecting: true, loading: true }, () => {
        this.registerUserAction(user.email);
      });
    } else {
    }
  };

  registerUserAction = (email) => {
    Sentry.configureScope((scope) => {
      scope.setUser({ id: email });
    });

    mixpanel.identify(email);

    mixpanel.people.set({
      $email: email,
      $last_login: new Date(),
    });

    registerUser((res) => {
      if (res.status === 200) {
        this.props.history.push("/home");
      } else {
        this.setState({
          redirecting: false,
          failedToConnect: true,
          loading: false,
        });
      }
    });
  };

  handleLogin = () => {
    const { email, password } = this.state;
    if (email === "" && password === "") {
      this.setState({
        errorMessage: "Enter email and password to login",
        errorTitle: "We need more information",
        showErrorDialog: true,
      });
    } else if (email === "") {
      this.setState({
        errorMessage: "Enter email",
        errorTitle: "We need more information",
        showErrorDialog: true,
      });
    } else if (password === "") {
      this.setState({
        errorMessage: "Enter password",
        errorTitle: "We need more information",
        showErrorDialog: true,
      });
    } else {
      this.setState({ loading: true });
      firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          firebase
            .auth()
            .signInWithEmailAndPassword(email, password)
            .then(() => {
              this.registerUserAction(email);
            })
            .catch((error) => {
              let errorMessage = "";
              if (error.code === "auth/user-not-found") {
                // Just sign them up instead
                this.handleSignUp();
                return;
              } else if (error.code === "auth/invalid-email") {
                errorMessage = "That's not a valid email address";
              } else if (error.code === "auth/wrong-password") {
                errorMessage =
                  "That's the wrong password for the provided email";
              } else if (error.code === "auth/network-request-failed") {
                errorMessage = "Something is wrong with the network. Try again";
              } else {
                errorMessage = error.message;
              }

              this.setState({
                errorMessage: errorMessage,
                loading: false,
                errorTitle: "Error",
                showErrorDialog: true,
              });
            });
        })
        .catch((error) =>
          this.setState({
            errorMessage: error.message,
            loading: false,
            errorTitle: "Error",
            showErrorDialog: true,
          })
        );
    }
  };

  forgotPassword = () => {
    const { email } = this.state;

    if (!isValidEmail(email)) {
      return this.setState({
        errorMessage: "Enter valid email to reset password",
        errorTitle: "We need more information",
        showErrorDialog: true,
      });
    }

    firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        this.setState({
          errorMessage: "A password reset email has been sent to you",
          errorTitle: "Check your email",
          showErrorDialog: true,
        });
      })
      .catch((error) =>
        this.setState({
          errorMessage: error.message,
          loading: false,
          errorTitle: "Error",
          showErrorDialog: true,
        })
      );
  };

  handleSignUp = () => {
    const { email, password } = this.state;
    if (email === "" && password === "") {
      this.setState({
        errorMessage: "Enter email and password to sign up",
        errorTitle: "We need more information",
        showErrorDialog: true,
      });
    } else if (email === "") {
      this.setState({
        errorMessage: "Enter email",
        errorTitle: "We need more information",
        showErrorDialog: true,
      });
    } else if (password === "") {
      this.setState({
        errorMessage: "Enter password",
        errorTitle: "We need more information",
        showErrorDialog: true,
      });
    } else {
      this.setState({ loading: true });

      firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          firebase
            .auth()
            .createUserWithEmailAndPassword(email, password)
            .then(() => {
              firebase.auth().currentUser.sendEmailVerification();
              this.registerUserAction(email);
            })
            .catch((error) => {
              let errorMessage = "";
              if (error.code === "auth/email-already-in-use") {
                errorMessage =
                  "We already have an account with that email. Try logging in instead";
              } else if (error.code === "auth/invalid-email") {
                errorMessage = "That's not a valid email address";
              } else if (error.code === "auth/weak-password") {
                errorMessage =
                  "Your password needs to be at least 6 characters";
              } else {
                errorMessage = error.message;
              }

              this.setState({
                errorMessage: errorMessage,
                loading: false,
                errorTitle: "Error",
                showErrorDialog: true,
              });
            });
        });
    }
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  loginWithGoogle = () => {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  };

  handleEnterKey = (event) => {
    let { isLogin } = this.state;
    if (event.key === "Enter") {
      if (isLogin) this.handleLogin();
      else {
        this.handleSignUp();
      }
    }
  };

  render() {
    let { classes } = this.props;

    const {
      isLogin,
      redirecting,
      showErrorDialog,
      errorMessage,
      errorTitle,
      loading,
    } = this.state;

    const signupView = (
      <React.Fragment>
        <Grid container direction="column" justify="center" alignItems="center">
          <Grid item xs>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={this.handleSignUp}
            >
              Sign Up
            </Button>
          </Grid>

          <Grid item className={classes.bottomLink}>
            <Link
              variant="body2"
              underline="none"
              className={classes.bottomLink}
              onClick={() => this.setState({ isLogin: true })}
            >
              {"Already have an account? Login"}
            </Link>
          </Grid>
        </Grid>
      </React.Fragment>
    );
    const loginView = (
      <React.Fragment>
        <Grid container direction="column" justify="center" alignItems="center">
          <Grid item xs>
            <div className={classes.relativePosition}>
              {loading ? (
                <div className={classes.submit}>
                  <CircularProgress size={24} />
                </div>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                  onClick={this.handleLogin}
                >
                  Login
                </Button>
              )}
            </div>
          </Grid>

          <Grid
            item
            className={classes.bottomLink}
            style={{ marginTop: loading ? 17 : 10 }}
          >
            <Link
              variant="body2"
              underline="none"
              className={classes.bottomLink}
              onClick={() => this.setState({ isLogin: false })}
            >
              {"Don't have an account? Sign Up"}
            </Link>
          </Grid>
          <Grid item xs className={classes.bottomLink}>
            <Link
              onClick={this.forgotPassword}
              variant="body2"
              underline="none"
              className={classes.bottomLink}
            >
              I forgot my password
            </Link>
          </Grid>
        </Grid>
      </React.Fragment>
    );

    if (redirecting) {
      return <div className={classes.redirectingLabel}>Loading...</div>;
    }

    return (
      <div className={classes.container}>
        <CssBaseline />
        <Grid container direction="row" style={{ height: "100%" }}>
          <Grid item xs={12} sm={12} md={5} lg={5} xl={5}>
            <div className={classes.paper}>
              <img
                src={Images.logoText}
                className={classes.logoText}
                alt="logo"
              />
              <form className={classes.form} noValidate>
                <div className={classes.centerContent}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={this.loginWithGoogle}
                    className={classes.googleLoginButton}
                    startIcon={
                      <img
                        src={Images.googleLogo}
                        alt="googlelogo"
                        className={classes.iconButton}
                      />
                    }
                  >
                    Login with Google
                  </Button>
                  <Typography className={classes.margin10}>or</Typography>
                </div>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  color="secondary"
                  InputLabelProps={{
                    className: classes.input,
                  }}
                  InputProps={{
                    className: classes.input,
                  }}
                  value={this.state.email}
                  onChange={this.handleChange}
                  onKeyPress={this.handleEnterKey}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  color="secondary"
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  InputLabelProps={{
                    className: classes.input,
                  }}
                  InputProps={{
                    className: classes.input,
                  }}
                  value={this.state.password}
                  onChange={this.handleChange}
                  onKeyPress={this.handleEnterKey}
                />
                {isLogin ? loginView : signupView}
              </form>
              <Typography variant="body1" className={classes.error}>
                {this.state.failedToConnect
                  ? "Oops! We can't reach our servers right now. Check your network and try again"
                  : ""}
              </Typography>
            </div>
          </Grid>
          <Grid item xs={12} sm={12} md={7} lg={7} xl={7}>
            <LoginSplashScreen />
          </Grid>
        </Grid>
        <Dialog
          open={showErrorDialog}
          onClose={() => {
            this.setState({
              showErrorDialog: false,
              errorMessage: "",
              errorTitle: "",
            });
          }}
        >
          <DialogTitle>{errorTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText>{errorMessage}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                this.setState({
                  showErrorDialog: false,
                  errorMessage: "",
                  errorTitle: "",
                });
              }}
              variant="contained"
              color="primary"
              autoFocus
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default withStyles(styles)(Login);
