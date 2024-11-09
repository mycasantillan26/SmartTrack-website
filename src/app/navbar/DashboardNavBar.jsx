import React from 'react';
import '../navbar/dashboardNavBar.css';
import logo from '../images/nobg.png';
import userPic from '../images/user.png'; 

export default function DashboardNavBar({ firstName, lastName, profilePic, onProfileClick }) {
    return (
        <div id="container">
            <div id="yellow"></div>
            <div id="logocontainer">
                <img src={logo} alt="SmartTrack Logo" className="logo" />
                <p className="logo-text"><span>SMART</span>TRACK</p>
            </div>
            <div className="navbar-center">
                <p className="welcome-text">Welcome, {firstName} {lastName}</p>
            </div>
            <div className="navbar-right">
                <div className="profile-pic" onClick={onProfileClick} style={{ cursor: 'pointer' }}>
                    <img 
                        src={profilePic || userPic} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                    />
                </div>
            </div>
        </div>
    );
}
