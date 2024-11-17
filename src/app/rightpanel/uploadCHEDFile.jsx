import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StepperComponent from '../stepper/Stepper';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as pdfjsLib from 'pdfjs-dist';

// Correctly set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const UploadCHEDFile = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [subjectData, setSubjectData] = useState(null);

  useEffect(() => {
    const fetchSubjectData = async () => {
      const db = getFirestore();
      if (!subjectId) {
        setSnackbarMessage('Invalid subject ID.');
        setSnackbarOpen(true);
        return;
      }
      try {
        const subjectDoc = await getDoc(doc(db, 'SubjectInformation', subjectId));
        if (subjectDoc.exists()) {
          setSubjectData(subjectDoc.data());
        } else {
          setSnackbarMessage('Subject not found.');
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage('Error fetching subject data: ' + error.message);
        setSnackbarOpen(true);
      }
    };

    fetchSubjectData();
  }, [subjectId]);

  const handleBack = () => {
    navigate(`/review-eto-file/${subjectId}`);
  };

  const handleNext = async () => {
    if (!selectedFile) {
      setSnackbarMessage('Please upload a file before proceeding.');
      setSnackbarOpen(true);
      return;
    }

    const fileName = selectedFile.name;

    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated.');

      const db = getFirestore();
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

      const extractedData = await processPdfFile(selectedFile);

      if (subjectData) {
        const path = `StudentsSerialNumber/${subjectData.subjectNumber}-${subjectData.semester}-${subjectData.academicYear}`;
        const batch = extractedData.map((row) => ({
          ...row,
          subjectId: subjectId,
        }));

        const collectionRef = collection(db, path);

        for (const record of batch) {
          await addDoc(collectionRef, record);
        }
      }

      setSnackbarMessage('File uploaded and data saved successfully.');
      setSnackbarOpen(true);
      navigate(`/review-ched-file/${docRef.id}`);
    } catch (error) {
      setSnackbarMessage('Error uploading file: ' + error.message);
      setSnackbarOpen(true);
    }
  };

  const processPdfFile = async (file) => {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async (event) => {
        const typedArray = new Uint8Array(event.target.result);
        try {
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          const extractedData = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const rows = textContent.items.map((item) => item.str);

            for (const row of rows) {
              const columns = row.split(/\s+/);
              if (columns.length >= 6) {
                const [no, serialNo, ay, surname, firstname, middleName] = columns;
                extractedData.push({
                  no: no.trim(),
                  serialNo: serialNo.trim(),
                  ay: ay.trim(),
                  surname: surname.trim(),
                  firstname: firstname.trim(),
                  middleName: middleName.trim(),
                });
              }
            }
          }

          resolve(extractedData);
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Error reading file.'));
      };

      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const acceptedFileTypes = ['application/pdf'];

    if (file && acceptedFileTypes.includes(file.type)) {
      setSelectedFile(file);
      setSnackbarMessage('File selected: ' + file.name);
    } else {
      setSnackbarMessage('Invalid file type. Please upload a PDF document.');
      setSelectedFile(null);
    }
    setSnackbarOpen(true);
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
        <StepperComponent activeStep={3} />
      </Box>
      <Box sx={{ flex: '1' }}>
        <Typography variant="h4" gutterBottom>
          Upload CHED File
        </Typography>
        <Typography variant="body1">Uploaded ETO File ID: {subjectId}</Typography>
        {subjectData && (
          <Typography variant="body1">Subject Name: {subjectData.subjectName}</Typography>
        )}

        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleBack} sx={{ mr: 2 }}>
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
