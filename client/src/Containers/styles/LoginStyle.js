import Colors from "../../Themes/Colors";
import blue from "@material-ui/core/colors/blue";
import grey from "@material-ui/core/colors/grey";

const useStyles = {
  paper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoText: {
    marginTop: 100,
    marginBottom: 40,
    height: 60,
  },
  input: {
    borderColor: grey[400],
  },
  header: {
    color: Colors.black,
  },
  error: {
    color: Colors.red,
  },
  iconButton: {
    height: 20,
    width: 20,
  },
  googleLoginButton: {
    color: grey[900],
    backgroundColor: Colors.white,
    "&:hover": {
      backgroundColor: grey[100],
    },
  },
  form: {
    margin: "20px",
    flex: "1 1 auto",
    width: "60%",
  },
  submit: {
    marginTop: "25px",
    marginBottom: "25px",
  },
  margin10: {
    marginTop: 10,
    marginBottom: 10,
  },
  centerContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    height: "100vh",
  },
  innerContainer: {
    height: "100%",
  },
  bottomLink: {
    cursor: "pointer",
    textAlign: "center",
    marginTop: "10px",
    color: blue[700],
    "&:hover": {
      color: blue[900],
    },
  },
  redirectingLabel: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 20,
  },
  relativePosition: {
    position: "relative",
  },
  loadingStyle: {
    color: Colors.primary,
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
};

export default useStyles;
