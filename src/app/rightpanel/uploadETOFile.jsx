import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StepperComponent from "../stepper/Stepper";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";

import { getAuth } from "firebase/auth";
import DashboardNavBar from "../navbar/DashboardNavBar";
import arrowIcon from "../images/arrow.png";
import * as XLSX from "xlsx"; 
import Loading from "../Loading/Loading";


const UploadETOFile = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [subjectData, setSubjectData] = useState(null);
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [userData, setUserData] = useState(null);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore();

        // Fetch subject details
        const subjectDoc = await getDoc(doc(db, "SubjectInformation", subjectId));
        if (subjectDoc.exists()) {
          setSubjectData(subjectDoc.data());
        } else {
          setSnackbarMessage("Subject not found.");
          setSnackbarOpen(true);
        }

        // Fetch uploaded file data
        const fileQuery = query(collection(db, "uploadedETOFile"), where("subjectId", "==", subjectId));
        const fileDocs = await getDocs(fileQuery);
        if (!fileDocs.empty) {
          const fileDoc = fileDocs.docs[0];
          setUploadedFileData({ id: fileDoc.id, ...fileDoc.data() });
        }

        // Fetch user details
        if (userId) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbarMessage("Error fetching data.");
        setSnackbarOpen(true);
      }
    };

    fetchData();
  }, [subjectId, userId]);

  const handleBack = () => {
    
    if (userId && subjectId) {
      navigate(`/create-subject/${subjectId}?userId=${encodeURIComponent(userId)}`);
    } else {
      console.error("User ID or Subject ID is missing.");
      navigate("/dashboard");
    }
  };

  const handleArrowClick = () => {
    if (userData) {
      navigate(
        `/dashboard?firstName=${encodeURIComponent(userData.first_name || "Guest")}&lastName=${encodeURIComponent(
          userData.last_name || "User"
        )}&userId=${encodeURIComponent(userId)}`
      );
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const acceptedFileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (file && acceptedFileTypes.includes(file.type)) {
      setSelectedFile(file);
      setSnackbarMessage("File selected: " + file.name);
    } else {
      setSnackbarMessage("Invalid file type. Only Excel, XLSX, or CSV files are accepted.");
      setSelectedFile(null);
    }
    setSnackbarOpen(true);
  };

  const handleDeleteFile = async () => {
    try {
      const db = getFirestore();
      const storage = getStorage();
  
      if (uploadedFileData) {
        // Delete the file from Firebase Storage
        const fileRef = ref(storage, `ETOFile/${subjectId}/${uploadedFileData.fileName}`);
        await deleteObject(fileRef);
  
        // Delete the file metadata from Firestore
        await deleteDoc(doc(db, "uploadedETOFile", uploadedFileData.id));
        console.log(`Deleted uploaded file metadata: ${uploadedFileData.fileName}`);
  
        // Delete rows from ListOfStudents collection
        const subjectNumber = subjectData?.subjectNumber || "default";
        const semester = subjectData?.semester || "default";
        const academicYear = subjectData?.academicYear || "default";
        const listPath = `ListOfStudents/${subjectNumber}-${semester}-${academicYear}/students`;
  
        const studentQuery = query(collection(db, listPath));
        const studentDocs = await getDocs(studentQuery);
  
        if (!studentDocs.empty) {
          console.log("Deleting the following student rows:");
          for (const studentDoc of studentDocs.docs) {
            console.log(studentDoc.data()); // Log the student data being deleted
            await deleteDoc(studentDoc.ref);
          }
        } else {
          console.log("No student rows found to delete.");
        }
  
        // Update state
        setUploadedFileData(null);
        setSelectedFile(null);
        setSnackbarMessage("File and associated student data deleted successfully.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error deleting file and student data:", error);
      setSnackbarMessage("Error deleting file and student data: " + error.message);
      setSnackbarOpen(true);
    }
  };
  

  const handleNext = async () => {
    setLoading(true); // Show Loading component
    if (uploadedFileData) {
      navigate(`/review-eto-file/${uploadedFileData.id}?userId=${encodeURIComponent(userId)}`);

      return;
    }
  
    if (!selectedFile) {
      setSnackbarMessage("Please upload a file before proceeding.");
      setSnackbarOpen(true);
      setLoading(false); // Stop loading
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
        setLoading(false); // Stop loading
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
        setLoading(false); // Stop loading
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
    } finally {
      setLoading(false); // Stop loading only after all rows are processed
    }
  };
  
  

  return (
    <>
      <DashboardNavBar
        firstName={userData?.first_name || "Guest"}
        lastName={userData?.last_name || "User"}
        profilePic={userData?.profileImageUrl}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          sx={{
            flex: "0 0 300px",
            backgroundColor: "maroon",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <img
              src={arrowIcon}
              alt="Dashboard"
              style={{ cursor: "pointer", width: "24px", height: "24px", marginRight: "10px" }}
              onClick={handleArrowClick}
            />
            <Typography
              variant="h6"
              sx={{ color: "gold", fontWeight: "bold", textAlign: "center", flex: 1 }}
            >
              Stepper
            </Typography>
          </Box>
          <StepperComponent activeStep={1} />
        </Box>
        <Box sx={{ flex: 1, marginLeft: "20px" }}>
          <Typography variant="h4" gutterBottom>
            Upload ETO File
          </Typography>
          <Typography variant="body1">Subject ID: {subjectId}</Typography>
          {subjectData && <Typography variant="body1">Subject Name: {subjectData.subjectName}</Typography>}

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Box
              sx={{
                flex: 1,
                backgroundColor: uploadedFileData || selectedFile ? "#e0e0e0" : "#ffffff",
                border: "2px dashed maroon",
                borderRadius: "10px",
                padding: "20px",
                textAlign: "center",
                cursor: uploadedFileData || selectedFile ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={handleFileChange}
                disabled={!!uploadedFileData || !!selectedFile}
                style={{ display: "none" }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: uploadedFileData || selectedFile ? "not-allowed" : "pointer" }}>
                Drag files to upload
              </label>
            </Box>
            <Box sx={{ flex: 1 }}>
              {(uploadedFileData || selectedFile) ? (
                <Box>
                  <Typography variant="body1">{uploadedFileData?.fileName || selectedFile?.name}</Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDeleteFile}
                    sx={{ backgroundColor: "maroon", color: "white" }}
                  >
                    Delete
                  </Button>
                </Box>
              ) : (
                <Typography variant="body1">No file uploaded.</Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleBack} sx={{ mr: 2, backgroundColor: "maroon", color: "white" }}>
              Back
            </Button>
            <Button variant="contained" onClick={handleNext} sx={{ backgroundColor: "maroon", color: "white" }}>
              Next
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default UploadETOFile;
