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
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const UploadCHEDFile = () => {
  const { uploadedETOFileId } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [subjectData, setSubjectData] = useState(null);
  const [existingFile, setExistingFile] = useState(null);
  const [userId, setUserId] = useState(null);

  // Authenticate and get user ID
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
    const fetchUploadedETOFileData = async () => {
      if (!uploadedETOFileId) {
        setSnackbarMessage("Uploaded ETO File ID is not provided.");
        setSnackbarOpen(true);
        return;
      }

      const db = getFirestore();
      try {
        const uploadedETOFileDocRef = doc(db, "uploadedETOFile", uploadedETOFileId);
        const uploadedETOFileDoc = await getDoc(uploadedETOFileDocRef);

        if (uploadedETOFileDoc.exists()) {
          const uploadedETOFileData = uploadedETOFileDoc.data();
          const subjectDocRef = doc(db, "SubjectInformation", uploadedETOFileData.subjectId);
          const subjectDoc = await getDoc(subjectDocRef);

          if (subjectDoc.exists()) {
            setSubjectData(subjectDoc.data());
          } else {
            setSnackbarMessage(`Subject not found for ID: ${uploadedETOFileData.subjectId}`);
            setSnackbarOpen(true);
          }
        } else {
          setSnackbarMessage(`Uploaded ETO File not found for ID: ${uploadedETOFileId}`);
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage(`Error fetching uploaded ETO file data: ${error.message}`);
        setSnackbarOpen(true);
      }
    };

    const fetchExistingFile = async () => {
      if (!userId) return;

      const db = getFirestore();
      const fileRef = doc(db, "uploadedCHEDFile", `${userId}_${uploadedETOFileId}`);
      const fileDoc = await getDoc(fileRef);

      if (fileDoc.exists()) {
        setExistingFile(fileDoc.data());
      }
    };

    fetchUploadedETOFileData();
    if (userId) fetchExistingFile();
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

  const handleNext = async () => {
    if (existingFile) {
      navigate(`/review-ched-file/${uploadedETOFileId}`);
      return;
    }

    if (!selectedFile) {
      setSnackbarMessage("Please upload a file before proceeding.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const storage = getStorage();
      const db = getFirestore();

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

      setSnackbarMessage("File uploaded successfully.");
      setSnackbarOpen(true);
      navigate(`/review-ched-file/${uploadedETOFileId}`);
    } catch (error) {
      setSnackbarMessage(`Error uploading file: ${error.message}`);
      setSnackbarOpen(true);
    }
  };

  const handleRemoveFile = async () => {
    if (!existingFile) {
      setSnackbarMessage("No file to delete.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const storage = getStorage();
      const fileRef = ref(storage, `CHEDFile/${uploadedETOFileId}/${existingFile.fileName}`);

      await deleteObject(fileRef);

      const db = getFirestore();

      await deleteDoc(doc(db, "uploadedCHEDFile", `${userId}_${uploadedETOFileId}`));

      setExistingFile(null);
      setSnackbarMessage("File deleted successfully.");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(`Error deleting file: ${error.message}`);
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
        {subjectData ? (
          <Typography variant="body1">Subject Name: {subjectData.subjectName}</Typography>
        ) : (
          <Typography variant="body1" color="error">
            Subject data not available.
          </Typography>
        )}
        {existingFile ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <Typography variant="body1">
              Previously Uploaded File:{" "}
              <a href={existingFile.fileURL} target="_blank" rel="noopener noreferrer">
                {existingFile.fileName}
              </a>
            </Typography>
            <Button variant="outlined" color="error" onClick={handleRemoveFile}>
              Delete
            </Button>
          </Box>
        ) : (
          <Typography variant="body1">No previously uploaded file found.</Typography>
        )}

        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
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
