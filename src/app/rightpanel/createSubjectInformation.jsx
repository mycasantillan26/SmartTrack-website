import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import StepperComponent from '../stepper/Stepper';
import Loading from '../Loading/Loading';
import DashboardNavBar from '../navbar/DashboardNavBar';
import { db } from '../../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import arrowIcon from '../images/arrow.png';
import Button from '@mui/material/Button';

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

const CreateSubjectInformation = () => {
  const [subjectName, setSubjectName] = useState('');
  const [subjectNumber, setSubjectNumber] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [userData, setUserData] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const generatedYears = Array.from({ length: 3 }, (_, i) => `${currentYear - 1 + i}-${currentYear + i}`);
    setAcademicYears(generatedYears);
    setAcademicYear(generatedYears[1]);

    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');

    if (userId) {
      fetchUserData(userId);
    }

    const subjectId = location.pathname.split('/').pop();
    if (subjectId && subjectId !== 'create-subject') {
      setDocumentId(subjectId);
      fetchSubjectData(subjectId);
    } else {
      setIsPageLoading(false);
    }
  }, [location.search, location.pathname]);

  const fetchUserData = async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        console.error('No user document found.');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchSubjectData = async (subjectId) => {
    try {
      const docRef = doc(db, 'SubjectInformation', subjectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSubjectName(data.subjectName || '');
        setSubjectNumber(data.subjectNumber || '');
        setSemester(data.semester || '');
        setAcademicYear(data.academicYear || '');
      } else {
        setSnackbarMessage('No subject found for the given ID.');
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage(`Error fetching subject information: ${error.message}`);
      setOpenSnackbar(true);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleBackClick = () => {
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');
    const { first_name = 'Guest', last_name = 'User' } = userData || {};
  
    if (userId) {
      navigate(
        `/dashboard?firstName=${encodeURIComponent(first_name)}&lastName=${encodeURIComponent(last_name)}&userId=${encodeURIComponent(
          userId
        )}`
      );
    } else {
      console.error('User ID is missing.');
    }
  };
  

  const handleSubmit = async () => {
    if (!subjectName || !subjectNumber || !semester || !academicYear) {
      setSnackbarMessage('Please fill in all fields.');
      setOpenSnackbar(true);
      return;
    }
  
    // Ensure userId is available
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');
  
    if (!userId) {
      setSnackbarMessage('User ID not found. Please log in.');
      setOpenSnackbar(true);
      return;
    }
  
    try {
      setLoading(true);
      const subjectId = documentId || uuidv4();
      const docRef = doc(db, 'SubjectInformation', subjectId);
  
      await setDoc(docRef, {
        subjectName,
        subjectNumber,
        semester,
        academicYear,
        userId, // Use the retrieved userId
        createdAt: new Date(),
      });
  
      setSnackbarMessage('Subject information submitted successfully.');
      setOpenSnackbar(true);
      navigate(`/upload-eto-file/${subjectId}?userId=${userId}`); // Pass the userId for continuity
    } catch (error) {
      setSnackbarMessage(`Error submitting subject information: ${error.message}`);
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSnackbarClose = () => setOpenSnackbar(false);

  if (isPageLoading) {
    return <Loading />;
  }

  return (
    <>
      <DashboardNavBar
        firstName={userData?.first_name || 'Guest'}
        lastName={userData?.last_name || 'User'}
        profilePic={userData?.profileImageUrl}
        disableProfileClick // Ensure this is handled in the `DashboardNavBar` component
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            flex: { xs: 'none', md: '0 0 300px' },
            backgroundColor: 'maroon',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <img
              src={arrowIcon}
              alt="Back"
              style={{
                cursor: 'pointer',
                width: '24px',
                height: '24px',
                marginRight: '10px',
              }}
              onClick={handleBackClick}
            />
            <Typography
              variant="h6"
              sx={{ color: 'gold', fontWeight: 'bold', textAlign: 'center', flex: 1 }}
            >
              Stepper
            </Typography>
          </Box>
          <StepperComponent />
        </Box>

        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="h5" sx={{ color: 'maroon', fontWeight: 'bold', marginBottom: '20px' }}>
            Create Subject Information
          </Typography>

          <TextField
            label="Subject Name"
            variant="outlined"
            fullWidth
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            sx={{ marginBottom: '20px', backgroundColor: '#f9f9f9' }}
          />

          <TextField
            label="Subject Number"
            variant="outlined"
            fullWidth
            value={subjectNumber}
            onChange={(e) => setSubjectNumber(e.target.value)}
            sx={{ marginBottom: '20px', backgroundColor: '#f9f9f9' }}
          />

          <TextField
            select
            label="Select Semester"
            variant="outlined"
            fullWidth
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            SelectProps={{
              native: true,
            }}
            sx={{ marginBottom: '20px', backgroundColor: '#f9f9f9' }}
          >
            <option value="">Select Semester</option>
            <option value="1st sem">1st Semester</option>
            <option value="2nd sem">2nd Semester</option>
            <option value="summer">Summer</option>
          </TextField>

          <TextField
            select
            label="Select Academic Year"
            variant="outlined"
            fullWidth
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            SelectProps={{
              native: true,
            }}
            sx={{ marginBottom: '20px', backgroundColor: '#f9f9f9' }}
          >
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                backgroundColor: 'maroon',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '5px',
                padding: '10px 20px',
                '&:hover': { backgroundColor: '#800000' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'gold' }} /> : 'Next'}
            </Button>
          </Box>

          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            TransitionComponent={SlideTransition}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarMessage.includes('success') ? 'success' : 'error'}
              sx={{
                backgroundColor: snackbarMessage.includes('success') ? 'maroon' : 'black',
                color: 'gold',
              }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </>
  );
};

export default CreateSubjectInformation;
