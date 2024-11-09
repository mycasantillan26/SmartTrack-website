import React from 'react';
import { Link } from 'react-router-dom'; 
import '../navbar/landingpageNavBar.css'; 
import logo from '../images/nobg.png'; 


export default function LandingPageNavBar(){
    return(
        <div id="container">
            <div id="yellow"></div>
            <div id="logocontainer">
                
                <img src={logo} alt="SmartTrack Logo" className="logo" />
                <p className="logo-text"><span>SMART</span>TRACK</p>
            </div>
            <div className="auth-buttons">
                    <Link to="/signin"> 
                        <button className="sign-in">Sign In</button>
                    </Link>
                    <Link to="/signup"> 
                        <button className="sign-up">Sign Up</button>
                    </Link>
                </div>
        </div>
    );
}