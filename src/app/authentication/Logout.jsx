import React from 'react';

const Logout = ({ onConfirm, onCancel }) => {
    return (
        <div className="logout-confirmation">
            <h2>Are you sure you want to log out?</h2>
            <div>
                <button onClick={onConfirm}>Yes</button>
                <button onClick={onCancel}>No</button>
            </div>
        </div>
    );
};

export default Logout;
