import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StepperComponent from '../stepper/Stepper';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { getFirestore, doc, getDoc, query, where, getDocs, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const UploadCHEDFile = () => {
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

      if (!subjectId) {
        setSnackbarMessage('Invalid subject ID.');
        setSnackbarOpen(true);
        return;
      }

      console.log("Fetching subject data for ID:", subjectId);
      try {
        const subjectDoc = await getDoc(doc(db, 'SubjectInformation', subjectId));
        if (subjectDoc.exists()) {
          setSubjectData(subjectDoc.data());
        } else {
          setSnackbarMessage('Subject not found');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
        setSnackbarMessage('Error fetching subject data: ' + error.message);
        setSnackbarOpen(true);
      }
    };

    const fetchUploadedFileData = async () => {
      const db = getFirestore();

      if (!subjectId) {
        setSnackbarMessage('Invalid subject ID.');
        setSnackbarOpen(true);
        return;
      }

      console.log("Fetching uploaded file data for subject ID:", subjectId);
      try {
        const q = query(collection(db, 'uploadedCHEDFile'), where('subjectId', '==', subjectId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const fileData = querySnapshot.docs[0].data();
          setUploadedFileData({ ...fileData, id: querySnapshot.docs[0].id });
        } else {
          console.log("No uploaded file data found for subject ID:", subjectId);
        }
      } catch (error) {
        console.error('Error fetching uploaded file data:', error);
        setSnackbarMessage('Error fetching uploaded file data: ' + error.message);
        setSnackbarOpen(true);
      }
    };

    fetchSubjectData();
    fetchUploadedFileData();
  }, [subjectId]);

  const handleBack = () => {
    navigate(`/review-eto-file/${subjectId}`);
  };

  const handleNext = async () => {
    if (uploadedFileData) {
      console.log("Navigating to review page with existing file ID:", uploadedFileData.id);
      navigate(`/review-ched-file/${uploadedFileData.id}`);
      return;
    }

    if (!selectedFile) {
      setSnackbarMessage('Please upload a file before proceeding.');
      setSnackbarOpen(true);
      return;
    }

    const fileName = selectedFile.name;
    console.log("Selected File Name:", fileName);

    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated.");

      const db = getFirestore();
      const q = query(
        collection(db, 'uploadedCHEDFile'),
        where('subjectId', '==', subjectId),
        where('fileName', '==', fileName)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingFileId = querySnapshot.docs[0].id;
        console.log("Navigating to review page with existing file ID:", existingFileId);
        navigate(`/review-ched-file/${existingFileId}`);
        return;
      }

      const docRef = await addDoc(collection(db, 'uploadedCHEDFile'), {
        subjectId: subjectId,
        userId: userId,
        fileName: fileName,
        createdAt: new Date(),
      });

      const storage = getStorage();
      const fileRef = ref(storage, `CHEDFile/${subjectId}/${docRef.id}/${fileName}`);

      await uploadBytes(fileRef, selectedFile);
      const fileURL = await getDownloadURL(fileRef);

      await updateDoc(docRef, { fileURL });

      console.log("Navigating to review page with new file ID:", docRef.id);
      navigate(`/review-ched-file/${docRef.id}`);
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
      'text/csv',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
      setSnackbarMessage('Invalid file type. Please upload an Excel, CSV, PDF, or Word document.');
      setSelectedFile(null);
    }
    setSnackbarOpen(true);
  };

  const handleRemoveUploadedFile = async () => {
    if (uploadedFileData) {
      const storage = getStorage();
      const fileRef = ref(storage, `CHEDFile/${subjectId}/${uploadedFileData.id}/${uploadedFileData.fileName}`);
  
      try {
        await deleteObject(fileRef);
        console.log("File deleted from storage.");
      } catch (error) {
        console.error("Error deleting file from storage:", error);
        setSnackbarMessage("Error deleting file from storage: " + error.message);
        setSnackbarOpen(true);
        return;
      }
  
      const db = getFirestore();
      const fileDocRef = doc(db, 'uploadedCHEDFile', uploadedFileData.id);
  
      try {
        await deleteDoc(fileDocRef);
        console.log("File document deleted from Firestore.");
      } catch (error) {
        console.error("Error deleting file document from Firestore:", error);
        setSnackbarMessage("Error deleting file document from Firestore: " + error.message);
        setSnackbarOpen(true);
        return;
      }
  
    
      setUploadedFileData(null);
      setSelectedFile(null);
      setSnackbarMessage("File removed successfully.");
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage("No file to remove.");
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
          Upload CHED File
        </Typography>
        <Typography variant="body1">
          Uploaded ETO File ID: {subjectId}
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
                style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }}
                onClick={handleRemoveUploadedFile}
              >
                Remove
              </span>
            </p>
          </Box>
        ) : (
          <input type="file" onChange={handleFileChange} />
        )}

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleBack}>
            Back
          </Button>
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        autoHideDuration={6000}
      />
    </Box>
  );
};

export default UploadCHEDFile;
