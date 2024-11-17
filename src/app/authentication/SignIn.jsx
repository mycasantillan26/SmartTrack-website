import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import '../Loading/Loading.css';
import Loading from '../Loading/Loading';
import logo from '../images/logo.jpeg';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import nobg from '../images/nobg.png';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                throw new Error("Please verify your email before signing in.");
            }

            // Fetch user-specific details (mock example)
            const firstName = "Myca"; // Replace with real data fetching
            const lastName = "Santillan"; // Replace with real data fetching
            const userId = user.uid; // Assuming Firebase UID serves as userId

            // Navigate to the user-specific dashboard
            navigate(`/dashboard?firstName=${firstName}&lastName=${lastName}&userId=${userId}`);
        } catch (error) {
            setError("Error signing in: " + error.message);
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowErrorModal(false);
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prevState) => !prevState);
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="signin-container">
            <div className="form-container">
                <form onSubmit={handleSubmit} id="formwrapp">
                    <h2 className="form-title">Log in</h2>
                    <div className="input-group">
                        <TextField
                            id="email"
                            label="Email Address"
                            variant="outlined"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className="input-group">
                        <TextField
                            id="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={togglePasswordVisibility}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                ),
                            }}
                        />
                    </div>
                    <Button type="submit" className="sign-in-button" variant="contained" color="primary">
                        Sign In
                    </Button>
                </form>
                <p className="signup-link">No account? <a href="/signup">Click here</a></p>
                <p className="forgot-password-link">
                    <a href="/reset-password">Forgot Password? Click here</a>
                </p>
            </div>
            <div className="logo-container">
                <img src={logo} alt="Logo" className="logo" />
            </div>

            {showErrorModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <button className="modal-close-button" onClick={handleCloseModal}>
                            &times;
                        </button>
                        <img src={nobg} alt="Floating Box" className="modal-bg" />
                        <h3 className="modal-error-message">{error}</h3>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignIn;
