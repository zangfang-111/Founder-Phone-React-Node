import React from "react";
import { Route, Redirect } from "react-router-dom";
import firebase from "firebase/app";

const ProtectedRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      render={(props) =>
        firebase.auth().currentUser !== null ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
      {...rest}
    />
  );
};
export default ProtectedRoute;
