import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StepperComponent from '../stepper/Stepper';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as XLSX from 'xlsx';

const UploadETOFile = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [subjectData, setSubjectData] = useState(null);
  const [uploadedFileData, setUploadedFileData] = useState(null);

  // Fetch Subject and Uploaded File Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore();
        const subjectDoc = await getDoc(doc(db, 'SubjectInformation', subjectId));
        if (subjectDoc.exists()) {
          setSubjectData(subjectDoc.data());
        } else {
          setSnackbarMessage('Subject not found');
          setSnackbarOpen(true);
        }

        const fileQuery = query(collection(db, 'uploadedETOFile'), where('subjectId', '==', subjectId));
        const fileDocs = await getDocs(fileQuery);
        if (!fileDocs.empty) {
          setUploadedFileData(fileDocs.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbarMessage('Error fetching data.');
        setSnackbarOpen(true);
      }
    };

    fetchData();
  }, [subjectId]);

  const handleBack = () => {
    navigate(`/create-subject/${subjectId}`);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const acceptedFileTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (file && acceptedFileTypes.includes(file.type)) {
      setSelectedFile(file);
      setSnackbarMessage('File selected: ' + file.name);
    } else {
      setSnackbarMessage('Invalid file type. Only Excel files (.xls, .xlsx) and CSV files (.csv) are accepted.');
      setSelectedFile(null);
    }
    setSnackbarOpen(true);
  };

  const handleNext = async () => {
    if (uploadedFileData) {
      setSnackbarMessage('A file is already uploaded. Please delete it before uploading a new one.');
      setSnackbarOpen(true);
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
      if (!userId) throw new Error('User not authenticated.');

      const db = getFirestore();
      const storage = getStorage();

      // Upload File to Firebase Storage
      const storageRef = ref(storage, `ETOFile/${subjectId}/${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const fileURL = await getDownloadURL(storageRef);

      console.log('ETOFile successfully uploaded to Firebase Storage.');

      // Save File Metadata in Firestore
      const fileDoc = await addDoc(collection(db, 'uploadedETOFile'), {
        subjectId,
        userId,
        fileName: selectedFile.name,
        fileURL,
        uploadedAt: new Date(),
      });
      const docId = fileDoc.id;

      // Parse Uploaded File
      const response = await fetch(fileURL);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length === 0) {
        setSnackbarMessage('The uploaded file is empty.');
        setSnackbarOpen(true);
        return;
      }

      // Detect Header Row
      const headers = [
        'Count',
        'Student ID',
        'Student Name',
        'Course-Year',
        'Gender',
        'Subject Code',
        'Section',
        'Date of Birth',
        'Home Address',
        'Contact Number',
      ];
      const headerRowIndex = rows.findIndex((row) =>
        headers.every((header) => row.includes(header))
      );

      if (headerRowIndex === -1) {
        setSnackbarMessage('Invalid file format. Header row not found.');
        setSnackbarOpen(true);
        return;
      }

      const dataRows = rows.slice(headerRowIndex + 1);

      // Save Student Records to Firestore
      const subjectNumber = subjectData?.subjectNumber || 'default';
      const semester = subjectData?.semester || 'default';
      const academicYear = subjectData?.academicYear || 'default';
      const listPath = `ListOfStudents/${subjectNumber}-${semester}-${academicYear}/students`;

      for (const [index, row] of dataRows.entries()) {
        const studentData = {
          Count: row[0] || index + 1,
          StudentID: row[1] || '',
          StudentName: row[2] || '',
          CourseYear: row[3] || '',
          Gender: row[4] || '',
          SubjectCode: row[5] || '',
          Section: row[6] || '',
          DateOfBirth: row[7] || '',
          HomeAddress: row[8] || '',
          ContactNumber: row[9] || '',
          SubjectId: subjectId,
          UploadedBy: userId,
        };

        console.log(`Inserting row ${index + 1}:`, studentData);
        await addDoc(collection(db, listPath), studentData);
      }

      console.log('All student records successfully uploaded to ListOfStudents.');

      setSnackbarMessage('All rows successfully uploaded.');
      setSnackbarOpen(true);

      navigate(`/review-eto-file/${docId}`);
    } catch (error) {
      console.error('Error processing the file:', error.message);
      setSnackbarMessage('Error processing the file: ' + error.message);
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      const db = getFirestore();
      const storage = getStorage();

      if (uploadedFileData) {
        const fileRef = ref(storage, `ETOFile/${subjectId}/${uploadedFileData.fileName}`);
        await deleteObject(fileRef);

        const fileQuery = query(collection(db, 'uploadedETOFile'), where('subjectId', '==', subjectId));
        const fileDocs = await getDocs(fileQuery);

        for (const fileDoc of fileDocs.docs) {
          await deleteDoc(fileDoc.ref);
        }

        const subjectNumber = subjectData?.subjectNumber || 'default';
        const semester = subjectData?.semester || 'default';
        const academicYear = subjectData?.academicYear || 'default';
        const listPath = `ListOfStudents/${subjectNumber}-${semester}-${academicYear}/students`;

        const studentQuery = query(collection(db, listPath));
        const studentDocs = await getDocs(studentQuery);

        for (const studentDoc of studentDocs.docs) {
          await deleteDoc(studentDoc.ref);
        }

        setSnackbarMessage('File and associated student records deleted.');
        setSnackbarOpen(true);
        setUploadedFileData(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error.message);
      setSnackbarMessage('Error deleting file: ' + error.message);
      setSnackbarOpen(true);
    }
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
        <Typography variant="body1">Subject ID: {subjectId}</Typography>
        {subjectData && <Typography variant="body1">Subject Name: {subjectData.subjectName}</Typography>}

        {uploadedFileData ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">Uploaded File:</Typography>
            <p>{uploadedFileData.fileName}</p>
            <Button variant="contained" color="secondary" onClick={handleDelete}>
              Delete File
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ mt: 2 }}>
              <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFileChange} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleBack} sx={{ mr: 2 }}>
                Back
              </Button>
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            </Box>
          </>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </Box>
  );
};

export default UploadETOFile;
