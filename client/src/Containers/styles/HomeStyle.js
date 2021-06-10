import Colors from "../../Themes/Colors";
import yellow from "@material-ui/core/colors/yellow";

const styles = (theme) => ({
  container: {
    height: "100vh",
    paddingLeft: 0,
    backgroundColor: "#fafafa",
  },
  gridContainer: {
    height: "100vh",
    marginLeft: 0,
    paddingLeft: 0,
    marginRight: 0,
    paddingRight: 0,
  },
  leftMenu: {
    backgroundColor: Colors.navMenu,
    overflow: "hidden",
  },
  selectedComponentStyle: {
    cursor: "pointer",
    height: 50,
    display: "flex",
    alignItems: "center",
    backgroundColor: Colors.menuSelected,
    color: Colors.selectedText,
    textDecoration: "none",
  },
  unselectedComponentStyle: {
    cursor: "pointer",
    height: 50,
    display: "flex",
    alignItems: "center",
    backgroundColor: Colors.navMenu,
    color: Colors.white,
    textDecoration: "none",
    "&:hover": {
      backgroundColor: Colors.menuHighlight,
    },
  },
  selectedComponentText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.selectedText,
    marginLeft: 22,
  },
  unselectedComponentText: {
    fontSize: 16,
    fontWeight: "regular",
    color: Colors.white,
    marginLeft: 22,
  },
  menuIcon: {
    marginLeft: 25,
  },
  componentHolder: {
    [theme.breakpoints.down("md")]: {
      height: "100vh",
    },
    [theme.breakpoints.up("sm")]: {
      height: "100vh",
      boxShadow: "0 2px 7px 0px rgba(0,0,0,.1)",
      overflow: "auto",
    },
  },
  componentsNameDiv: {
    marginTop: 10,
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
  logo: {
    height: 30,
    marginTop: 20,
    marginLeft: 4,
  },
  backArrow: {
    color: Colors.appRed,
  },
  domain: {
    marginTop: 20,
    padding: 10,
    margin: "auto",
    fontSize: 22,
    color: yellow[400],
    wordBreak: "break-word",
  },
});
export default styles;
