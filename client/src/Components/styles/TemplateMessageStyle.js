import Colors from "../../Themes/Colors";

const styles = (theme) => ({
  marginTop10: {
    marginTop: 10,
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
  height80: {
    height: "80vh",
  },
  padding20: {
    padding: 20,
  },
  padding10: {
    padding: 10,
  },
  textStyle: {
    color: Colors.fontColor,
    fontSize: 16,
    paddingTop: 5,
  },
  highlightWord: {
    color: Colors.textHighlight,
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
  savedTemplateContainer: {
    paddingLeft: 10,
    paddingTop: 10,
    marginTop: 10,
  },
  savedTemplateItem: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    "&:hover": {
      borderRadius: 5,
      backgroundColor: "#E5E5E5",
    },
  },
  noSavedTemplates: {
    fontSize: 16,
    paddingLeft: 10,
    fontWeight: 500,
    marginTop: 20,
  },
  introMessageCounter: {
    textAlign: "right",
    paddingTop: 10,
  },
  progressStyle: {
    display: "flex",
    justifyContent: "center",
    marginTop: 15,
  },
  marginRight15: {
    marginRight: 15,
  },
});

export default styles;
