  import React, { useState, useEffect } from 'react';
  import { initializeApp } from 'firebase/app';
  import { getFirestore, doc, setDoc, collection, getDoc } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { useNavigate, useLocation } from 'react-router-dom';  
  import Box from '@mui/material/Box';
  import Button from '@mui/material/Button';
  import Snackbar from '@mui/material/Snackbar';
  import Alert from '@mui/material/Alert';
  import TextField from '@mui/material/TextField';
  import CircularProgress from '@mui/material/CircularProgress';
  import Slide from '@mui/material/Slide';
  import { v4 as uuidv4 } from 'uuid';
  import Panel from '../dashboard/panel'; 
  import StepperComponent from '../stepper/Stepper'; 
  import Typography from '@mui/material/Typography';
  import { db, auth} from '../../firebaseConfig';



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
    const [user, setUser] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); 

    
    const generateAcademicYears = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = -1; i <= 1; i++) {
        const startYear = currentYear + i;
        const endYear = startYear + 1;
        years.push(`${startYear}-${endYear}`);
      }
      return years;
    };

    useEffect(() => {
      
      const years = generateAcademicYears();
      setAcademicYears(years);
      setAcademicYear(years[1]);
    
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
    
     
      const subjectId = location.pathname.split('/').pop(); 
      if (subjectId && subjectId !== 'create-subject') { 
        setDocumentId(subjectId);
        fetchSubjectData(subjectId); 
      } else {
        setDocumentId(null); 
      }
    
      return () => unsubscribe();
    }, [location.pathname]);

    const fetchSubjectData = async (subjectId) => {
      setLoading(true);
      try {
        const docRef = doc(db, 'SubjectInformation', subjectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSubjectName(data.subjectName);
          setSubjectNumber(data.subjectNumber);
          setSemester(data.semester);
          setAcademicYear(data.academicYear);
        } else {
          setSnackbarMessage('No subject found for the given ID.');
          setOpenSnackbar(true);
        }
      } catch (error) {
        setSnackbarMessage('Error fetching subject information: ' + error.message);
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async () => {
      setLoading(true);
     
      // Validate inputs
      if (!subjectName || !subjectNumber || !semester || !academicYear) {
        setSnackbarMessage('Please fill in all fields.');
        setLoading(false);
        setOpenSnackbar(true);
        return;
      }
     
      if (!user) {
        setSnackbarMessage('User not authenticated. Please log in.');
        setLoading(false);
        setOpenSnackbar(true);
        return;
      }
     
      try {
       
        const subjectId = documentId || uuidv4(); 
     
        const docRef = doc(db, 'SubjectInformation', subjectId);
     
        await setDoc(docRef, {
          subjectName,
          subjectNumber,
          semester,
          academicYear,
          userId: user.uid,
          createdAt: new Date(),
        });
     
        setSnackbarMessage('Subject information submitted successfully.');
     
        
        navigate(`/upload-eto-file/${subjectId}`, { state: { subjectId } });
     
      } catch (error) {
        setSnackbarMessage('Error submitting subject information: ' + error.message);
      } finally {
        setLoading(false);
      
        if (!documentId) {
          
          setSubjectName('');
          setSubjectNumber('');
          setSemester('');
          setAcademicYear(academicYears[1]);
          setDocumentId(null); 
        }
      }
    };
  
    

    const handleSnackbarClose = () => {
      setOpenSnackbar(false);
    };

    return (
      <Box sx={{ display: 'flex', padding: '20px' }}>
        <Box sx={{ flex: '0 0 300px', marginRight: '20px' }}>
          <Typography variant="h6" gutterBottom>
            Stepper
          </Typography>
          <StepperComponent />
        </Box>

        <Box sx={{ flex: '1' }}>
          <Typography variant="h5" gutterBottom>
            Create Subject Information
          </Typography>

          <TextField
            label="Subject Name"
            variant="outlined"
            fullWidth
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            sx={{ marginBottom: '20px' }}
          />

          <TextField
            label="Subject Number"
            variant="outlined"
            fullWidth
            value={subjectNumber}
            onChange={(e) => setSubjectNumber(e.target.value)}
            sx={{ marginBottom: '20px' }}
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
            sx={{ marginBottom: '20px' }}
          >
            <option value="" disabled>
              Select Semester
            </option>
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
            sx={{ marginBottom: '20px' }}
          >
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Next'}
            </Button>
          </Box>

          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            TransitionComponent={SlideTransition}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbarMessage.includes('success') ? 'success' : 'error'}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    );
  };

  export default CreateSubjectInformation;
