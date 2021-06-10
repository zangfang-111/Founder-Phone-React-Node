import grey from "@material-ui/core/colors/grey";

const useStyles = (theme) => ({
  cardFormContainer: {
    display: "flex",
    flexDirection: "column",
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 0,
  },
  cardOnFile: {
    marginTop: 10,
    marginBottom: 10,
    color: grey[700],
  },
  cardForm: {
    [theme.breakpoints.down("md")]: {
      padding: 20,
      marginTop: 10,
      marginBottom: 20,
    },
    [theme.breakpoints.up("md")]: {
      width: 400,
      padding: 20,
      marginTop: 10,
      marginBottom: 20,
    },
  },
  saveButton: {
    [theme.breakpoints.down("md")]: {
      display: "flex",
      paddingLeft: 20,
      paddingRight: 20,
      marginBottom: 10,
      flexDirection: "column",
      justifyItems: "center",
      alignItems: "center",
    },
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      paddingLeft: 20,
      paddingRight: 20,
      marginBottom: 10,
      width: 400,
      flexDirection: "column",
      justifyItems: "center",
      alignItems: "center",
    },
  },
  headerStyle: {
    color: "#9c9797",
    fontSize: 16,
  },
  width100: {
    width: "100%",
  },
  margin10: {
    margin: 10,
  },
  cardEntryForm: {
    display: "flex",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
    },
  },
  saveButtonStyle: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
    [theme.breakpoints.up("md")]: {
      marginLeft: 20,
      marginTop: 29,
    },
  },
});

export default useStyles;
