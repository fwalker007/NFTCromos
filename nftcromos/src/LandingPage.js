import { useEffect, useState, Suspense, useRef } from "react";
import { useMoralis } from "react-moralis";
import { BrowserRouter as Router, Switch, Route, NavLink, Redirect} from "react-router-dom";
import Account from "components/Account";
import NFTBalance from "components/NFTBalance";
import { Menu, Layout, Button} from "antd";
import "antd/dist/antd.css";
import "./style.css";
import { Logo } from "Logo";

 
const LandingPage = ({onClickReset})=>{
    return(
        <div className="headerNew">
            <div className="logo-nft">
            <NavLink to="/"><Logo /></NavLink>
            {/* <Logo /> */}
            <Button onClick={onClickReset} className="reset" >Reset</Button>
            <NavLink to="/nftBalance">Your NFTs:</NavLink>
            </div>
            <div className="address">
            <Account />
            </div>
        </div>
    )
}

export default LandingPage;