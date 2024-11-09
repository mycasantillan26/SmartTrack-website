import React, { useState } from 'react';
import './SignUp.css'; 
import logo from '../images/logo.jpeg'; 
import nobg from '../images/nobg.png'; 
import { getFirestore, doc, setDoc, getDoc, query, where, getDocs, collection } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { Link } from 'react-router-dom'; 
import TextField from '@mui/material/TextField';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';
import { app, auth } from "../../firebaseConfig"; 
import { IconButton } from '@mui/material';

const db = getFirestore(app); 

const SignUp = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    id_number: '',
    email_address: '',
    password: '',
    confirm_password: ''
  });

  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false); 
  const [visible, setVisible] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const validateIdNumber = (idNumber) => {
    const regex = /^[\d-]+$/;
    return regex.test(idNumber);
  };

  const checkIfUserExists = async (idNumber, email) => {
    const usersRef = collection(db, "users");
    const idQuery = query(usersRef, where("id_number", "==", idNumber));
    const emailQuery = query(usersRef, where("email_address", "==", email));
    
    const idSnapshot = await getDocs(idQuery);
    const emailSnapshot = await getDocs(emailQuery);
    
    return !idSnapshot.empty || !emailSnapshot.empty; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email_address.endsWith('@cit.edu')) {
      setError('Email must be a valid @cit.edu address.');
      setShowModal(true);
      return;
    }

    if (!validateIdNumber(formData.id_number)) {
      setError('ID number must contain only numbers and hyphens.');
      setShowModal(true);
      return;
    }

    const userExists = await checkIfUserExists(formData.id_number, formData.email_address);
    if (userExists) {
      setError('This ID number or email address is already registered.');
      setShowModal(true);
      return;
    }

    const isPasswordValid = validatePassword(formData.password);
    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long and contain uppercase letters, lowercase letters, numbers, and special characters.');
      setShowModal(true);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      setShowModal(true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email_address, formData.password);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, "users", userId), {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        id_number: formData.id_number,
        email_address: formData.email_address
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      setShowModal(true);

      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        id_number: '',
        email_address: '',
        password: '',
        confirm_password: ''
      });

    } catch (error) {
      console.error("Error signing up:", error.message);
      setError("Error signing up: " + error.message);
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setVisible(false);
  };

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="signup-container">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>
      <div className="form-container">
        <form onSubmit={handleSubmit} id='formwrapper'>
          <h2 className="form-title">Registration</h2>
          <div className="input-group">
            <TextField
              id="email_address"
              label="Email Address"
              variant="outlined"
              name="email_address"
              value={formData.email_address}
              onChange={handleChange}
              required
              fullWidth />
          </div>
          <div id="namecontainer" className="input-group">
            <div className="input-group-item">
              <TextField
                id="first_name" 
                label="First Name"
                variant="outlined"
                name="first_name" 
                value={formData.first_name} 
                onChange={handleChange}
                required
                fullWidth 
              />
            </div>
            <div className="input-group-item">
              <TextField
                id="middle_name" 
                label="M.I"
                variant="outlined"
                name="middle_name" 
                value={formData.middle_name} 
                onChange={handleChange} 
                required 
                fullWidth 
              />
            </div>
            <div className="input-group-item">
              <TextField
                id="last_name" 
                label="Last Name"
                variant="outlined"
                name="last_name" 
                value={formData.last_name} 
                onChange={handleChange} 
                required 
                fullWidth 
              />
            </div>
          </div>
          <div className="input-group">
            <TextField
              label="ID Number"
              variant="outlined"
              id="id_number" 
              name="id_number" 
              value={formData.id_number} 
              onChange={handleChange} 
              required 
              fullWidth/>
          </div>
          <div className="input-group">
            <TextField
              id="password"
              label="Password"
              variant="outlined"
              name="password"
              type={showPassword ? 'text' : 'password'} // Toggle type based on showPassword
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          </div>

          <div className="input-group">
            <TextField
              id="confirm_password"
              label="Confirm Password"
              variant="outlined"
              name="confirm_password"
              type={showPassword ? 'text' : 'password'} // Toggle type based on showPassword
              value={formData.confirm_password}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          </div>

          <button type="submit" className="sign-in-button">Sign Up</button>
        </form>
        <div className="sign-in-link">
          <p>Already have an account? <Link to="/signin">Click here</Link></p>
        </div>
      </div>
      {showModal && (
                  <>
                    <div className="modal-overlay" />
                    <div className="modal">
                      <div className="modal-content">
                        <button className="modal-close-button" onClick={handleModalClose}>
                          &times;
                        </button>
                        <img src={nobg} alt="Floating Box" className="modal-bg" />
                        <h2>{error ? 'Error' : 'Registration Successful'}</h2>
                        <p>{error ? error : 'Kindly check your email to confirm.'}</p>
                        <br />
                        <div className="sign-in-link">
                          <Link
                            to={error ? "#" : "/signin"}
                            style={{
                              color: 'gold',
                              textDecoration: 'none',
                              fontWeight: 'bold',
                              cursor: error ? 'pointer' : 'auto'
                            }}
                            onClick={error ? handleModalClose : null} // Close modal on Retry click
                          >
                            {error ? 'Retry' : 'Go to Sign In'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                    
    </div>
  );
};

export default SignUp;
