import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StepperComponent from '../stepper/Stepper';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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
          setSnackbarMessage('Subject not found.');
          setSnackbarOpen(true);
        }

        const fileQuery = query(collection(db, 'uploadedETOFile'), where('subjectId', '==', subjectId));
        const fileDocs = await getDocs(fileQuery);
        if (!fileDocs.empty) {
          const fileDoc = fileDocs.docs[0];
          setUploadedFileData({ id: fileDoc.id, ...fileDoc.data() });
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
      setSnackbarMessage('Invalid file type. Only Excel, XLSX, or CSV files are accepted.');
      setSelectedFile(null);
    }
    setSnackbarOpen(true);
  };

  const handleNext = async () => {
    if (uploadedFileData) {
      // Navigate to ReviewETOFile with the existing uploaded file docId
      navigate(`/review-eto-file/${uploadedFileData.id}`);
      return;
    }
  
    if (!selectedFile) {
      setSnackbarMessage("Please upload a file before proceeding.");
      setSnackbarOpen(true);
      return;
    }
  
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated.");
  
      const db = getFirestore();
      const storage = getStorage();
  
      // Upload File to Firebase Storage
      const storageRef = ref(storage, `ETOFile/${subjectId}/${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const fileURL = await getDownloadURL(storageRef);
  
      // Save File Metadata in Firestore
      const fileDoc = await addDoc(collection(db, "uploadedETOFile"), {
        subjectId,
        userId,
        fileName: selectedFile.name,
        fileURL,
        uploadedAt: new Date(),
      });
      const docId = fileDoc.id;
  
      // Parse and Save Data to ListOfStudents
      const response = await fetch(fileURL);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      if (rows.length === 0) {
        setSnackbarMessage("The uploaded file is empty.");
        setSnackbarOpen(true);
        return;
      }
  
      const headers = [
        "Count",
        "Student ID",
        "Student Name",
        "Course-Year",
        "Gender",
        "Subject Code",
        "Section",
        "Date of Birth",
        "Home Address",
        "Contact Number",
      ];
      const headerRowIndex = rows.findIndex((row) =>
        headers.every((header) => row.includes(header))
      );
  
      if (headerRowIndex === -1) {
        setSnackbarMessage("Invalid file format. Header row not found.");
        setSnackbarOpen(true);
        return;
      }
  
      const dataRows = rows.slice(headerRowIndex + 1);
      const subjectNumber = subjectData?.subjectNumber || "default";
      const semester = subjectData?.semester || "default";
      const academicYear = subjectData?.academicYear || "default";
      const listPath = `ListOfStudents/${subjectNumber}-${semester}-${academicYear}/students`;
  
      for (const [index, row] of dataRows.entries()) {
        const studentId = row[1]?.toString().trim(); // Ensure `Student ID` is a string
        if (!studentId) {
          console.warn(`Skipping row ${index + 1} due to missing Student ID.`);
          continue; // Skip rows with missing `Student ID`
        }
  
        const studentData = {
          Count: row[0] || index + 1,
          StudentID: studentId,
          StudentName: row[2] || "",
          CourseYear: row[3] || "",
          Gender: row[4] || "",
          SubjectCode: row[5] || "",
          Section: row[6] || "",
          DateOfBirth: row[7] || "",
          HomeAddress: row[8] || "",
          ContactNumber: row[9] || "",
          SubjectId: subjectId,
          UploadedBy: userId,
        };
  
        // Log the data being inserted
        console.log(`Inserting row into database:`, studentData);
  
        // Use `StudentID` as the document ID
        await setDoc(doc(db, listPath, studentId), studentData, { merge: true });
      }
  
      setSnackbarMessage("Data successfully saved to the database.");
      setSnackbarOpen(true);
      navigate(`/review-eto-file/${docId}`);
    } catch (error) {
      console.error("Error processing the file:", error.message);
      setSnackbarMessage("Error processing the file: " + error.message);
      setSnackbarOpen(true);
    }
  };
  
  

  const handleDelete = async () => {
    try {
      const db = getFirestore();
      const storage = getStorage();
  
      if (uploadedFileData) {
        // Log file to be deleted
        console.log(`Deleting file from storage: ${uploadedFileData.fileName}`);
        const fileRef = ref(storage, `ETOFile/${subjectId}/${uploadedFileData.fileName}`);
        await deleteObject(fileRef);
  
        // Query and delete uploadedETOFile records
        const fileQuery = query(collection(db, 'uploadedETOFile'), where('subjectId', '==', subjectId));
        const fileDocs = await getDocs(fileQuery);
  
        for (const fileDoc of fileDocs.docs) {
          console.log('Deleting file metadata from Firestore:', fileDoc.data());
          await deleteDoc(fileDoc.ref);
        }
  
        const subjectNumber = subjectData?.subjectNumber || 'default';
        const semester = subjectData?.semester || 'default';
        const academicYear = subjectData?.academicYear || 'default';
        const listPath = `ListOfStudents/${subjectNumber}-${semester}-${academicYear}/students`;
  
        // Query and delete student records
        const studentQuery = query(collection(db, listPath));
        const studentDocs = await getDocs(studentQuery);
  
        for (const studentDoc of studentDocs.docs) {
          console.log('Deleting student record:', studentDoc.data());
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
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDelete}
              sx={{ mr: 2 }}
            >
              Delete File
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFileChange} />
          </Box>
        )}

        {/* Always show Back and Next buttons */}
        <Box sx={{ mt: 3 }}>
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
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </Box>
  );
};

export default UploadETOFile;
