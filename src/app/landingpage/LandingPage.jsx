import React from 'react';
import { Link } from 'react-router-dom'; 
import './LandingPage.css'; 
import logo from '../images/nobg.png'; 
import LandingPageNavBar from '../navbar/landingpageNavBar';

const LandingPage = () => {
    return (
        <div className="container">
            <LandingPageNavBar/>
            <div className="center-logo">
                <img src={logo} alt="SmartTrack Logo" />
            </div>
        </div>
    );
};

export default LandingPage;
