const firebaseConfigStaging = {
  apiKey: "AIzaSyDVY6NLm4ADKa0SmVfStLL-TJW8oZmC1FE",
  authDomain: "founderphone-staging.firebaseapp.com",
  databaseURL: "https://founderphone-staging.firebaseio.com",
  projectId: "founderphone-staging",
  storageBucket: "founderphone-staging.appspot.com",
  messagingSenderId: "458416278135",
  appId: "1:458416278135:web:370f3650d448a7d071d472",
};

const firebaseConfigProd = {
  apiKey: "AIzaSyAfzeQXBrEnG7Ng5L9qDikci-yYzzll4WY",
  authDomain: "founderphonecom.firebaseapp.com",
  databaseURL: "https://founderphonecom.firebaseio.com",
  projectId: "founderphonecom",
  storageBucket: "founderphonecom.appspot.com",
  messagingSenderId: "860233009432",
  appId: "1:860233009432:web:116db49f32f56e8b88f66d",
};

const firebaseConfig =
  process.env.REACT_APP_NODE_ENV === "production"
    ? firebaseConfigProd
    : firebaseConfigStaging;

export default firebaseConfig;
