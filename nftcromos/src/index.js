import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { MoralisProvider } from "react-moralis";
import "./index.css";
import { MoralisDappProvider } from "./providers/MoralisDappProvider/MoralisDappProvider";
import { Modal } from "antd";

/** Get your free Moralis Account https://moralis.io/ */

const APP_ID = process.env.REACT_APP_MORALIS_APPLICATION_ID;
const SERVER_URL = process.env.REACT_APP_MORALIS_SERVER_URL;

const Application = () => {

  const isServerInfo = APP_ID && SERVER_URL ? true : false;
  
  function MoralisError() {
    let secondsToGo = 5;
    const modal = Modal.error({
      title: "Error!",
      content: `MISSING MORALIS SERVER INFO! Rename env.example to .env and enter the Moralis server information`,
    });
    setTimeout(() => {
      modal.destroy();
    }, secondsToGo * 1000);
  }

  if (isServerInfo)
    return (
      <MoralisProvider appId={APP_ID} serverUrl={SERVER_URL}>
        <MoralisDappProvider>
          <App isServerInfo />
        </MoralisDappProvider>
      </MoralisProvider>
    );
  else {
    console.error( " MISSING MORALIS SERVER INFO !! Rename env.example to .env and enter the Moralis server information" )
    MoralisError()   
    return (
       <div> </div>   
    );
  }
};

ReactDOM.render(

  // <React.StrictMode>
  <Application />,
  // </React.StrictMode>,
  document.getElementById("root")
);
