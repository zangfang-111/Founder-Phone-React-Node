import colors from "../../Themes/Colors";

const styles = (theme) => ({
  container: {
    // height: "100vh",
    height: "85%",
  },
  padding10: {
    padding: 10,
  },
  marginTop10: {
    marginTop: 10,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 20,
    "&:hover": {
      cursor: "pointer",
    },
  },
  height100: {
    height: "100%",
  },
  height80: {
    height: "80%",
  },
  width100: {
    width: "100%",
  },
  paper: {
    margin: 10,
    height: "100%",
    overflowY: "auto",
  },
  mainDiv: {
    position: "relative",
    overflow: "hidden",
    height: "100%",
    width: "100%",
  },
  headerDiv: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "10%",
    overflow: "hidden",
  },
  bodyDiv: {
    position: "absolute",
    top: 50,
    bottom: 50,
    left: 0,
    overflow: "auto",
    height: "75%",
    width: "98%",
    margin: 10,
  },
  footerDiv: {
    position: "absolute",
    bottom: 0,
    height: "15%",
    left: 0,
    overflow: "hidden",
    width: "97%",
    margin: 10,
  },
  dateDiv: {
    color: colors.fontColor,
    fontSize: 13,
    marginTop: 10,
  },
  slackLogo: {
    width: 20,
    float: "left",
    padding: 10,
  },
  calledImage: {
    width: 20,
    float: "right",
    padding: 10,
  },
});
export default styles;
