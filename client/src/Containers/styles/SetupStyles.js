import Colors from "../../Themes/Colors";
import grey from "@material-ui/core/colors/grey";

const styles = (theme) => ({
  parentContainer: {
    backgroundColor: Colors.backgroundColor,
    height: "100%",
  },
  container: {
    paddingBottom: 30,
  },
  innerContainer: {
    [theme.breakpoints.down("sm")]: {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  marginTop10: {
    marginTop: 10,
  },
  marginTop20: {
    marginTop: 20,
  },
  marginTop30: {
    marginTop: 30,
  },
  marginBottom30: {
    marginBottom: 30,
  },
  margin10: {
    margin: 10,
  },
  width100: {
    width: "100%",
  },
  padding20: {
    padding: 20,
  },
  padding10: {
    padding: 10,
  },
  width80: {
    width: "80%",
  },
  width35: {
    [theme.breakpoints.down("md")]: {},
    [theme.breakpoints.up("sm")]: {
      width: "35%",
    },
  },
  textStyle: {
    color: Colors.fontColor,
    fontSize: 16,
    paddingTop: 5,
  },
  headerStyle: {
    fontSize: 16,
    paddingLeft: 10,
    fontWeight: 500,
  },
  paper: {
    borderRadius: 10,
    boxShadow: "0 2px 7px 0px rgba(0,0,0,.1)",
  },
  width25: {
    width: "25%",
  },
  phoneNumberWidth: {
    width: 260,
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  redirectNumberWidth: {
    width: 150,
  },
  promoWidth: {
    width: 100,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  connectBtnStyle: {
    borderRadius: "2px",
    color: Colors.white,
    marginLeft: 10,
  },
  copyButton: {
    marginTop: 23,
    marginLeft: 10,
    [theme.breakpoints.down("xs")]: {
      margin: 20,
    },
  },
  privateChannelCheckbox: {
    marginLeft: 10,
  },
  codeStyle: {
    backgroundColor: grey[100],
    borderRadius: 10,
  },
  codeFont: {
    fontFamily: "Inconsolata",
    fontSize: 36,
    [theme.breakpoints.down("xs")]: {
      fontSize: 30,
    },
  },
  marginLeft10: {
    marginLeft: 10,
  },
  sectionHeader: {
    marginTop: 40,
    fontSize: 18,
    color: Colors.blue300,
  },
  center: {
    marginTop: 40,
    margin: "auto",
    display: "block",
  },
  iconButton: {
    margin: 5,
    height: 20,
    width: 20,
  },
  label: {
    color: grey[500],
    fontSize: 14,
    marginVertical: 10,
    marginLeft: 10,
  },
  subscribeButton: {
    [theme.breakpoints.down("sm")]: {
      width: "max-content",
    },
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  changeCard: {
    display: "flex",
    margin: 10,
  },
  buttonWidth: {
    width: "max-content",
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
});

export default styles;
