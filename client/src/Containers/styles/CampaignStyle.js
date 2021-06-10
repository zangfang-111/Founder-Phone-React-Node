import Colors from "../../Themes/Colors";

const styles = (theme) => ({
  container: {
    backgroundColor: Colors.backgroundColor,
    height: "100vh",
  },
  phoneNumber: {
    "& .react-tel-input .form-control:focus": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
    },
    "& .react-tel-input": {
      width: "initial",
    },
    "& .react-tel-input .form-control": {
      width: "197px",
    },
  },
  accountManagerFormControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    width: "50%",
    marginTop: 10,
  },
  accountManagerFormControlWrapper: {
    display: "inline-flex",
    width: "100%",
  },
});

export default styles;
