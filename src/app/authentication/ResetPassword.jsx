import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css'; 

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate(); 
    const auth = getAuth(); 

    const handleReset = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage('Check your email for a password reset link.');
            setTimeout(() => {
                navigate('/signin'); 
            }, 3000);
        } catch (error) {
            setErrorMessage("Error resetting password: " + error.message); 
        }
    };

    return (
        <div className="reset-password-container">
            <form onSubmit={handleReset} id='formwrapp'>
            <h2 className="form-title">Reset Password</h2>
                <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                </div>
                {successMessage && <p className="success-message">{successMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button type="submit" className="reset-button">Send Reset Link</button>
            </form>
            <p className="back-to-signin-link">
                <a href="/signin">Back to Sign In</a>
            </p>
        </div>
    );
};

export default ResetPassword;
