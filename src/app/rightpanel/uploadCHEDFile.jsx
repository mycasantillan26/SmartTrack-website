import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import StepperComponent from "../stepper/Stepper";
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";


const UploadCHEDFile = () => {
  const { uploadedETOFileId } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [existingFile, setExistingFile] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setSnackbarMessage("Please log in to continue.");
        setSnackbarOpen(true);
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchExistingFile = async () => {
      if (!uploadedETOFileId || !userId) return;

      try {
        const db = getFirestore();
        const fileRef = doc(db, "uploadedCHEDFile", `${userId}_${uploadedETOFileId}`);
        const fileDoc = await getDoc(fileRef);

        if (fileDoc.exists()) {
          setExistingFile(fileDoc.data());
        }
      } catch (error) {
        setSnackbarMessage(`Error fetching file: ${error.message}`);
        setSnackbarOpen(true);
      }
    };

    fetchExistingFile();
  }, [uploadedETOFileId, userId]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const acceptedFileTypes = ["application/pdf"];

    if (file && acceptedFileTypes.includes(file.type)) {
      setSelectedFile(file);
      setSnackbarMessage(`File selected: ${file.name}`);
    } else {
      setSnackbarMessage("Invalid file type. Please upload a PDF document.");
      setSelectedFile(null);
    }
    setSnackbarOpen(true);
  };

  const handleBack = () => {
    navigate(`/review-eto-file/${uploadedETOFileId}`);
  };
  
  const handleNext = async () => {
    try {
      const db = getFirestore();
      const storage = getStorage();
  
      // Check if there's already an existing file
      if (existingFile) {
        // Allow proceeding without uploading a new file
        setSnackbarMessage("Proceeding to the next step with the existing file.");
        setSnackbarOpen(true);
        navigate(`/review-ched-file/${uploadedETOFileId}`);
        return;
      }
  
      // If no file is uploaded yet, ensure a new file is selected
      if (!selectedFile) {
        setSnackbarMessage("Please upload a file before proceeding.");
        setSnackbarOpen(true);
        return;
      }
  
      // Upload new file
      const fileRef = ref(storage, `CHEDFile/${uploadedETOFileId}/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const fileURL = await getDownloadURL(fileRef);
  
      // Save metadata about the uploaded file
      await setDoc(doc(db, "uploadedCHEDFile", `${userId}_${uploadedETOFileId}`), {
        uploadedETOFileId,
        userId,
        fileName: selectedFile.name,
        fileURL,
        createdAt: new Date(),
      });
  
      setSnackbarMessage("File uploaded successfully. Parsing PDF...");
      setSnackbarOpen(true);
  
      // Fetch `subjectId` from `uploadedETOFile`
      const uploadedFileRef = doc(db, "uploadedETOFile", uploadedETOFileId);
      const uploadedFileDoc = await getDoc(uploadedFileRef);
  
      if (!uploadedFileDoc.exists()) {
        setSnackbarMessage("Uploaded ETO File not found. Cannot proceed.");
        setSnackbarOpen(true);
        return;
      }
  
      const { subjectId } = uploadedFileDoc.data();
  
      // Fetch Subject Information for path construction
      const subjectDocRef = doc(db, "SubjectInformation", subjectId);
      const subjectDoc = await getDoc(subjectDocRef);
  
      if (!subjectDoc.exists()) {
        setSnackbarMessage("Subject information not found. Cannot proceed.");
        setSnackbarOpen(true);
        return;
      }
  
      const { subjectNumber, semester, academicYear } = subjectDoc.data();
      const basePath = `StudentwithSerialNumber/${subjectNumber}-${semester}-${academicYear}/student`;
  
      // Parse PDF and add rows to Firestore
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
  
      let rowCount = 0;
  
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
  
        let rows = groupTextByYCoord(textContent.items);
  
        for (let j = 0; j < rows.length; j++) {
          const row = rows[j];
          const rowData = mapRowToData(row);
  
          if (isValidRow(rowData)) {
            const docRef = doc(db, basePath, rowData.SerialNo);
            await setDoc(docRef, rowData);
            rowCount++;
          }
        }
      }
  
      setSnackbarMessage(`Successfully added ${rowCount} rows to Firestore.`);
      navigate(`/review-ched-file/${uploadedETOFileId}`);
    } catch (error) {
      setSnackbarMessage(`Error processing file: ${error.message}`);
      setSnackbarOpen(true);
    }
  };
  
  
  // Group text by y-coordinate
  const groupTextByYCoord = (items) => {
    const rows = [];
    let currentRow = [];
    let lastY = null;
  
    items.forEach((item) => {
      const y = item.transform[5]; // y-coordinate
      const text = item.str.trim();
  
      if (!text) return; // Skip empty strings
  
      if (lastY === null) {
        lastY = y;
      }
  
      // New row detected based on y-coordinate difference
      if (Math.abs(y - lastY) > 5) {
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        lastY = y;
      }
  
      currentRow.push(text);
    });
  
    if (currentRow.length > 0) {
      rows.push(currentRow); // Add the last row
    }
  
    return rows;
  };
  
  // Map row data to structured format
  const mapRowToData = (row) => {
    // Ensure the row matches the expected structure
    if (row.length >= 6) {
      return {
        No: row[0],
        SerialNo: row[1].includes("-") ? row[1] : `${row[1]}-${row[3]}`,
        AY: `${row[4]}-${row[6]}`,
        Surname: row[7],
        Firstname: row[8],
        MiddleName: row[9] || "", // Handle missing middle names
      };
    }
    return null; // Invalid row
  };
  
  // Validate row data
  const isValidRow = (rowData) => {
    return (
      rowData &&
      rowData.No &&
      rowData.SerialNo &&
      rowData.AY &&
      rowData.Surname &&
      rowData.Firstname
    );
  };
  
  

  const handleRemoveFile = async () => {
    if (!existingFile) {
      setSnackbarMessage("No file to remove.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const db = getFirestore();
      const storage = getStorage();

      const fileRef = ref(storage, `CHEDFile/${uploadedETOFileId}/${existingFile.fileName}`);
      await deleteObject(fileRef);

      const fileDocRef = doc(db, "uploadedCHEDFile", `${userId}_${uploadedETOFileId}`);
      await deleteDoc(fileDocRef);

      setSnackbarMessage("File removed successfully.");
      setExistingFile(null);
    } catch (error) {
      setSnackbarMessage(`Error removing file: ${error.message}`);
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ display: "flex", padding: "20px" }}>
      <Box sx={{ flex: "0 0 300px", mr: "20px" }}>
        <StepperComponent activeStep={3} />
      </Box>

      <Box sx={{ flex: "1" }}>
        <Typography variant="h4" gutterBottom>
          Upload CHED File
        </Typography>

        {existingFile ? (
          <Box>
            <Typography variant="h6">Uploaded File: {existingFile.fileName}</Typography>
            <iframe
              src={existingFile.fileURL}
              style={{ width: "100%", height: "400px", marginTop: "20px" }}
              title="Uploaded PDF"
            />
            <Button
              variant="contained"
              color="error"
              sx={{ mt: 3 }}
              onClick={handleRemoveFile}
            >
              Remove File
            </Button>
          </Box>
        ) : (
          <input type="file" accept=".pdf" onChange={handleFileChange} />
        )}

        <Box sx={{ mt: 3 }}>
        <Button 
        variant="contained" 
        onClick={handleBack} 
        sx={{ mr: 2 }}
      >
        Back
      </Button>

          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        autoHideDuration={6000}
      />
    </Box>
  );
};

export default UploadCHEDFile;
