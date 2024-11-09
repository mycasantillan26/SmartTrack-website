import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StepperComponent from '../stepper/Stepper';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const UploadETOFile = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [subjectData, setSubjectData] = useState(null);
  const [uploadedFileData, setUploadedFileData] = useState(null);

  useEffect(() => {
    const fetchSubjectData = async () => {
      const db = getFirestore();
      const subjectDoc = await getDoc(doc(db, 'SubjectInformation', subjectId));
      if (subjectDoc.exists()) {
        setSubjectData(subjectDoc.data());
      } else {
        setSnackbarMessage('Subject not found');
        setSnackbarOpen(true);
      }
    };

    const fetchUploadedFileData = async () => {
      const db = getFirestore();
      const q = query(collection(db, 'uploadedETOFile'), where('subjectId', '==', subjectId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const fileData = querySnapshot.docs[0].data();
        setUploadedFileData({ ...fileData, id: querySnapshot.docs[0].id });
      }
    };

    fetchSubjectData();
    fetchUploadedFileData();
  }, [subjectId]);

  const handleBack = () => {
    navigate(`/create-subject/${subjectId}`);
  };

  const handleNext = async () => {

    if (uploadedFileData) {
    
      navigate(`/review-eto-file/${uploadedFileData.id}`);
      return;
    }

  
    if (!selectedFile) {
      setSnackbarMessage('Please upload a file before proceeding.');
      setSnackbarOpen(true);
      return;
    }

    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated.");

      const db = getFirestore();
      const q = query(collection(db, 'uploadedETOFile'), where('subjectId', '==', subjectId), where('fileName', '==', selectedFile.name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
   
        navigate(`/review-eto-file/${querySnapshot.docs[0].id}`);
        return;
      }

      const storage = getStorage();
     
      const docRef = await addDoc(collection(db, 'uploadedETOFile'), {
        subjectId: subjectId,
        userId: userId,
        fileName: selectedFile.name,
        createdAt: new Date(),
      });

      const fileRef = ref(storage, `ETOFile/${subjectId}/${docRef.id}/${selectedFile.name}`);

      await uploadBytes(fileRef, selectedFile);
      const fileURL = await getDownloadURL(fileRef);


      await updateDoc(docRef, { fileURL });

      navigate(`/review-eto-file/${docRef.id}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setSnackbarMessage('Error uploading file: ' + error.message);
      setSnackbarOpen(true);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const acceptedFileTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (file && acceptedFileTypes.includes(file.type)) {
  
      if (!uploadedFileData) {
        setSelectedFile(file);
        setSnackbarMessage('File selected: ' + file.name);
      } else {
        setSnackbarMessage('You must remove the existing file before uploading a new one.');
        setSelectedFile(null);
      }
    } else {
      setSnackbarMessage('Invalid file type. Only Excel files (.xls, .xlsx) and CSV files (.csv) are accepted.');
      setSelectedFile(null);
    }
    setSnackbarOpen(true);
  };

  const handleRemoveUploadedFile = async () => {
    if (uploadedFileData) {
      const storage = getStorage();
      const fileRef = ref(storage, `ETOFile/${subjectId}/${uploadedFileData.id}/${uploadedFileData.fileName}`);

      // Delete file from storage
      await deleteObject(fileRef).catch(error => {
        console.error("Error deleting file from storage:", error);
      });

      const db = getFirestore();
      const fileDocRef = doc(db, 'uploadedETOFile', uploadedFileData.id);

      // Delete file data from Firestore
      await deleteDoc(fileDocRef).catch(error => {
        console.error("Error deleting file document from Firestore:", error);
      });

      setUploadedFileData(null); 
      setSnackbarMessage('File removed successfully.');
      setSnackbarOpen(true);
      setSelectedFile(null); 
    } else {
    
      setSelectedFile(null);
      setSnackbarMessage('Selected file removed successfully.');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', padding: '20px' }}>
      <Box sx={{ flex: '0 0 300px', mr: '20px' }}>
        <Typography variant="h6" gutterBottom>
          Stepper
        </Typography>
        <StepperComponent activeStep={1} />
      </Box>
      <Box sx={{ flex: '1' }}>
        <Typography variant="h4" gutterBottom>
          Upload ETO File
        </Typography>
        <Typography variant="body1">
          Subject ID: {subjectId}
        </Typography>
        {subjectData && (
          <Typography variant="body1">
            Subject Name: {subjectData.subjectName}
          </Typography>
        )}

   
        {uploadedFileData ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">Uploaded File:</Typography>
            <p>
              File Name: {uploadedFileData.fileName}
              <span
                style={{ color: 'red', cursor: 'pointer', marginLeft: '8px' }}
                onClick={handleRemoveUploadedFile}
              >
                ❌
              </span>
            </p>
          </Box>
        ) : (
          <Typography variant="body1">No file uploaded yet.</Typography>
        )}

      
        {selectedFile && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">Selected File:</Typography>
            <p>
              File Name: {selectedFile.name}
              <span
                style={{ color: 'red', cursor: 'pointer', marginLeft: '8px' }}
                onClick={handleRemoveUploadedFile}
              >
                ❌
              </span>
            </p>
          </Box>
        )}


        <Box sx={{ mt: 2 }}>
          <input
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleFileChange}
          />
        </Box>

       
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleBack} sx={{ mr: 2 }}>
            Back
          </Button>
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        </Box>

      
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
        />
      </Box>
    </Box>
  );
};

export default UploadETOFile;
