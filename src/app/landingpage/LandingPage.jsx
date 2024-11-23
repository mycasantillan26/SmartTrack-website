import React from 'react';
import { Link } from 'react-router-dom'; 
import './LandingPage.css'; 
import logo from '../images/nobg.png'; 
import LandingPageNavBar from '../navbar/landingpageNavBar';
import AboutUs from './AboutUs';

const LandingPage = () => {
    return (
        <div className="container">
            <LandingPageNavBar/>
            <div className="center-logo">
                <img src={logo} alt="SmartTrack Logo" />
                <p style={{ color: 'maroon', fontSize: '20px', fontWeight: 'bold', marginTop: '10px' }}>
                NSTP Grade Tracking System
            </p>
            </div>
        </div>
        
    );
};

export default LandingPage;
