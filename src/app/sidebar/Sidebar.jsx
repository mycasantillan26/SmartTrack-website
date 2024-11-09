import React from 'react';
import './sidebar.css'; 
import leftIcon from '../images/left.png'; 

const Sidebar = ({ onSelect, onClose, currentPage }) => {

   
    return (
        <div className="sidebar">
            <img 
                src={leftIcon} 
                alt="Close Sidebar" 
                className="left-icon" 
                onClick={onClose} 
                style={{ cursor: 'pointer' }} 
            />
            
            <div 
                className={`sidebar-item ${currentPage === '/dashboard' ? 'active' : ''}`} 
                onClick={() => onSelect('/dashboard')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">DASHBOARD</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'viewGrades' ? 'active' : ''}`} 
                onClick={() => onSelect('viewGrades')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">VIEW GRADES</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'uploadETO' ? 'active' : ''}`} 
                onClick={() => onSelect('uploadETO')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">UPLOAD ETO FILE</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'uploadCHED' ? 'active' : ''}`} 
                onClick={() => onSelect('uploadCHED')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">UPLOAD CHED FILE</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'trackProgress' ? 'active' : ''}`} 
                onClick={() => onSelect('trackProgress')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">TRACK PROGRESS</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'notifications' ? 'active' : ''}`} 
                onClick={() => onSelect('notifications')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">NOTIFICATIONS</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'profile' ? 'active' : ''}`} 
                onClick={() => onSelect('profile')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">PROFILE</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'changePassword' ? 'active' : ''}`} 
                onClick={() => onSelect('changePassword')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">CHANGE PASSWORD</span>
            </div>

            <div 
                className={`sidebar-item ${currentPage === 'logout' ? 'active' : ''}`} 
                onClick={() => onSelect('/signin')}
            >
                <span className="sidebar-icon"></span>
                <span className="sidebar-text">LOGOUT</span>
            </div>
        </div>
    );
};

export default Sidebar;
