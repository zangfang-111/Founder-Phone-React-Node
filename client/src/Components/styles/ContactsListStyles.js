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
  padding20: {
    padding: 20,
  },
  padding25: {
    padding: 25,
  },
  padding10: {
    padding: 10,
  },
  textStyle: {
    color: Colors.fontColor,
    fontSize: 13,
  },
  headerStyle: {
    fontSize: 16,
    paddingLeft: 10,
    fontWeight: 500,
  },
  subHeaderStyle: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: 300,
  },
  paper: {
    borderRadius: 10,
    boxShadow: "0 2px 7px 0px rgba(0,0,0,.1)",
  },
  displayInline: {
    display: "inline-flex",
  },
  fontSize14: {
    fontSize: 14,
  },
  width20: {
    width: "20%",
  },
  overflowY: {
    overflowY: "auto",
  },
  height100: {
    height: "100%",
  },
  height50: {
    height: "50%",
  },
  textAlignCenter: {
    textAlign: "center",
  },
  height80: {
    height: "80vh",
  },
  positionRelative: {
    position: "relative",
  },
  addContact: {
    display: "inline-flex",
    margin: "auto",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    color: "#afafaf",
  },
  addContactDiv: {
    cursor: "pointer",
    textAlign: "center",
    marginLeft: 10,
  },
});

export default styles;
