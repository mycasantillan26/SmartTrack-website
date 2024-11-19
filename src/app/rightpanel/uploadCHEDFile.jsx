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
        setSnackbarMessage("Proceeding to the next step with the existing file.");
        setSnackbarOpen(true);
        navigate(`/review-ched-file/${uploadedETOFileId}`);
        return;
      }
  
      if (!selectedFile) {
        setSnackbarMessage("Please upload a file before proceeding.");
        setSnackbarOpen(true);
        return;
      }
  
      // Upload the file
      const fileRef = ref(storage, `CHEDFile/${uploadedETOFileId}/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const fileURL = await getDownloadURL(fileRef);
  
      // Save file metadata
      await setDoc(doc(db, "uploadedCHEDFile", `${userId}_${uploadedETOFileId}`), {
        uploadedETOFileId,
        userId,
        fileName: selectedFile.name,
        fileURL,
        createdAt: new Date(),
      });
  
      setSnackbarMessage("File uploaded successfully. Parsing PDF...");
      setSnackbarOpen(true);
  
      // Fetch `subjectId`
      const uploadedFileRef = doc(db, "uploadedETOFile", uploadedETOFileId);
      const uploadedFileDoc = await getDoc(uploadedFileRef);
  
      if (!uploadedFileDoc.exists()) {
        setSnackbarMessage("Uploaded ETO File not found. Cannot proceed.");
        setSnackbarOpen(true);
        return;
      }
  
      const { subjectId } = uploadedFileDoc.data();
  
      // Fetch Subject Information
      const subjectDocRef = doc(db, "SubjectInformation", subjectId);
      const subjectDoc = await getDoc(subjectDocRef);
  
      if (!subjectDoc.exists()) {
        setSnackbarMessage("Subject information not found. Cannot proceed.");
        setSnackbarOpen(true);
        return;
      }
  
      const { subjectNumber, semester, academicYear } = subjectDoc.data();
      const basePath = `StudentwithSerialNumber/${subjectNumber}-${semester}-${academicYear}/student`;
  
      // Parse PDF
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let rowCount = 0;
  
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
  
        const rows = groupTextByYCoord(textContent.items);
  
        for (const row of rows) {
          if (row.includes("NOTHING FOLLOWS")) {
            setSnackbarMessage("Encountered 'NOTHING FOLLOWS'. Stopping row insertion.");
            setSnackbarOpen(true);
            navigate(`/review-ched-file/${uploadedETOFileId}`);
            return;
          }
  
          const rowData = mapRowToData(row);
          if (isValidRow(rowData)) {
            const docRef = doc(db, basePath, rowData.SerialNo);
            await setDoc(docRef, rowData);
            rowCount++;
          }
        }
      }
  
      setSnackbarMessage(`Successfully added ${rowCount} rows to Firestore.`);
      setSnackbarOpen(true);
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
  
      // Step 1: Verify and delete the file from Firebase Storage
      const fileRef = ref(storage, `CHEDFile/${uploadedETOFileId}/${existingFile.fileName}`);
      const fileExists = await getDownloadURL(fileRef)
        .then(() => true)
        .catch(() => false);
  
      if (fileExists) {
        await deleteObject(fileRef);
        console.log(`Deleted file from Firebase Storage: ${existingFile.fileName}`);
      } else {
        console.warn("File does not exist in Firebase Storage.");
      }
  
      // Step 2: Delete metadata in uploadedCHEDFile
      const fileDocRef = doc(db, "uploadedCHEDFile", `${userId}_${uploadedETOFileId}`);
      const fileDoc = await getDoc(fileDocRef);
  
      if (fileDoc.exists()) {
        await deleteDoc(fileDocRef);
        console.log(`Deleted metadata for file: ${existingFile.fileName}`);
      } else {
        console.warn("File metadata not found in uploadedCHEDFile.");
      }
  
      // Step 3: Fetch the uploadedETOFile using the uploadedETOFileId from uploadedCHEDFile
      const uploadedETOFileRef = doc(db, "uploadedETOFile", uploadedETOFileId);
      const uploadedETOFileDoc = await getDoc(uploadedETOFileRef);
  
      if (!uploadedETOFileDoc.exists()) {
        console.warn(`Uploaded ETO File not found for ID: ${uploadedETOFileId}`);
        setSnackbarMessage("Uploaded ETO File not found. Cannot proceed.");
        setSnackbarOpen(true);
        return;
      }
  
      const { subjectId } = uploadedETOFileDoc.data();
      if (!subjectId) {
        console.warn("No subjectId found in uploadedETOFile metadata.");
        setSnackbarMessage("Subject information is missing. Cannot delete student records.");
        setSnackbarOpen(true);
        return;
      }
  
      // Step 4: Fetch subject information using the subjectId
      const subjectDocRef = doc(db, "SubjectInformation", subjectId);
      const subjectDoc = await getDoc(subjectDocRef);
  
      if (!subjectDoc.exists()) {
        console.warn(`Subject information not found for subjectId: ${subjectId}`);
        setSnackbarMessage("Subject information not found. Cannot delete student records.");
        setSnackbarOpen(true);
        return;
      }
  
      const { subjectNumber, semester, academicYear } = subjectDoc.data();
      if (!subjectNumber || !semester || !academicYear) {
        console.warn("Incomplete subject information. Cannot proceed with deletion.");
        setSnackbarMessage("Incomplete subject information. Cannot delete student records.");
        setSnackbarOpen(true);
        return;
      }
  
      const basePath = `StudentwithSerialNumber/${subjectNumber}-${semester}-${academicYear}`;
  
      // Step 5: Delete all student records under the subject
      const studentCollectionRef = collection(db, `${basePath}/student`);
      const studentDocs = await getDocs(studentCollectionRef);
  
      if (!studentDocs.empty) {
        const batch = writeBatch(db);
        console.log("Deleting the following student records:");
  
        studentDocs.forEach((doc) => {
          console.log(`- SerialNo: ${doc.id}, Data:`, doc.data());
          batch.delete(doc.ref);
        });
  
        await batch.commit();
        console.log("All student records under StudentwithSerialNumber deleted successfully.");
      } else {
        console.log("No student records found to delete.");
      }
  
      // Step 6: Delete the parent folder
      const parentFolderRef = doc(db, `StudentwithSerialNumber`, `${subjectNumber}-${semester}-${academicYear}`);
      const parentFolderDoc = await getDoc(parentFolderRef);
  
      if (parentFolderDoc.exists()) {
        await deleteDoc(parentFolderRef);
        console.log(`Deleted parent folder: ${basePath}`);
      } else {
        console.warn(`Parent folder ${basePath} does not exist.`);
      }
  
      setSnackbarMessage("File and all associated student records removed successfully.");
      setSnackbarOpen(true);
      setExistingFile(null);
    } catch (error) {
      console.error("Error removing file and student records:", error);
      setSnackbarMessage(`Error removing file and student records: ${error.message}`);
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
