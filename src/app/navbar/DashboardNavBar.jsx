import React, { useState } from 'react';
import '../navbar/dashboardNavBar.css';
import logo from '../images/nobg.png';
import userPic from '../images/user.png';

export default function DashboardNavBar({ firstName, lastName, profilePic, onProfileClick, onLogoutClick }) {
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    const handleProfileClick = () => {
        setDropdownVisible(false); // Close dropdown
        onProfileClick();
    };

    const handleLogoutClick = () => {
        setDropdownVisible(false); // Close dropdown
        onLogoutClick();
    };

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
            <div className="navbar-right" style={{ position: 'relative' }}>
                <div
                    className="profile-pic"
                    onClick={() => setDropdownVisible(!isDropdownVisible)}
                    style={{ cursor: 'pointer' }}
                >
                    <img 
                        src={profilePic || userPic} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                    />
                </div>
                {isDropdownVisible && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '60px',
                            right: '0',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            borderRadius: '5px',
                            zIndex: 2,
                        }}
                    >
                        <button 
                            onClick={handleProfileClick} 
                            style={{
                                display: 'block',
                                padding: '10px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                            }}
                        >
                            Profile
                        </button>
                        <button 
                            onClick={handleLogoutClick} 
                            style={{
                                display: 'block',
                                padding: '10px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                            }}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
