import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Modal,
  Box as MuiBox,
} from "@mui/material";
import Box from "@mui/material/Box";
import StepperComponent from "../stepper/Stepper";
import DashboardNavBar from "../navbar/DashboardNavBar";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as XLSX from "xlsx";
import { useNavigate, useLocation } from "react-router-dom";

const UploadStudentFileDetails = () => {
  const [userData, setUserData] = useState(null); // For logged-in user details
  const [mergedData, setMergedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract userId from query parameters
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get("userId");

  // Fetch logged-in user details
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.error("No user ID provided");
        return;
      }

      try {
        const db = getFirestore();
        const userRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          setUserData(userSnapshot.data());
        } else {
          console.error("User not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch and merge data
  useEffect(() => {
    const fetchAndMergeData = async () => {
      const db = getFirestore();
      try {
        const studentsRef = collection(db, "ListOfStudents/MYCA031-1st sem-2024-2025/students");
        const studentsSnapshot = await getDocs(studentsRef);

        const students = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const serialNumbersRef = collection(db, "StudentwithSerialNumber/MYCA031-1st sem-2024-2025/student");
        const serialNumbersSnapshot = await getDocs(serialNumbersRef);

        const serialNumbers = serialNumbersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const merged = students.flatMap((student) => {
          return serialNumbers
            .filter(
              (serial) =>
                serial.Firstname?.trim().toLowerCase() ===
                  student.StudentName?.split(",")[1]?.split(" ")[0]?.trim()?.toLowerCase() &&
                serial.Surname?.trim().toLowerCase() ===
                  student.StudentName?.split(",")[0]?.trim()?.toLowerCase()
            )
            .map((serial) => ({
              No: null, // Placeholder for No., will be assigned later
              SerialNo: serial.SerialNo,
              Surname: serial.Surname,
              Firstname: serial.Firstname,
              MiddleName: serial.MiddleName || " ",
              CourseYear: student.CourseYear || " ",
              Gender: student.Gender || " ",
              DateOfBirth: student.DateOfBirth || " ",
              HomeAddress: student.HomeAddress || " ",
              ContactNumber: student.ContactNumber || " ",
              EmailAddress: student.EmailAddress || " ",
            }));
        });

        const numberedMerged = merged.map((row, index) => ({
          ...row,
          No: index + 1,
        }));

        setMergedData(numberedMerged);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMergeData();
  }, []);

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleDownloadTable = () => {
    const worksheet = XLSX.utils.json_to_sheet(mergedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MergedData");
    XLSX.writeFile(workbook, "MergedStudentData.xlsx");
  };

  return (
    <>
      {userData && (
        <DashboardNavBar
          firstName={userData.first_name || "Guest"}
          lastName={userData.last_name || "User"}
          profilePic={userData.profileImageUrl || ""}
        />
      )}
  
      <Box
        sx={{
          display: "flex",
          height: "100vh", // Full viewport height
          overflow: "hidden", // Prevent scrolling for the entire page
          padding: "20px",
          gap: "20px",
        }}
      >
        {/* Left Side: Stepper */}
        <Box
          sx={{
            flex: "0 0 300px",
            backgroundColor: "maroon",
            color: "white",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", marginBottom: "20px", cursor: "pointer" }}
            onClick={() => navigate(`/dashboard?userId=${userId}`)}
          >
            <ArrowBackIcon sx={{ color: "gold", marginRight: "10px" }} />
            <Typography variant="h6" sx={{ color: "gold", fontWeight: "bold" }}>
              Stepper
            </Typography>
          </Box>
          <StepperComponent activeStep={5} />
        </Box>
  
        {/* Right Side: Main Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Prevent page scrolling
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h4" sx={{ color: "maroon" }}>
              Merged Student Data
            </Typography>
            <Button
              variant="contained"
              sx={{ backgroundColor: "gold", color: "maroon", fontWeight: "bold" }}
              onClick={handleDownloadTable}
            >
              Download Excel
            </Button>
          </Box>
  
          {/* Scrollable Table */}
          <Box
            component={Paper}
            sx={{
              flex: 1,
              overflowY: "auto", // Only the table can scroll vertically
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            {loading ? (
              <Typography sx={{ padding: "20px" }}>Loading data...</Typography>
            ) : mergedData.length > 0 ? (
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>No.</TableCell>
                    <TableCell>Serial No.</TableCell>
                    <TableCell>Surname</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Middle Name</TableCell>
                    <TableCell>Course/Program</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Birthdate</TableCell>
                    <TableCell>City Address</TableCell>
                    <TableCell>Contact Number</TableCell>
                    <TableCell>Email Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mergedData.map((row, index) => (
                    <TableRow
                      key={index}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell>{row.No}</TableCell>
                      <TableCell>{row.SerialNo}</TableCell>
                      <TableCell>{row.Surname}</TableCell>
                      <TableCell>{row.Firstname}</TableCell>
                      <TableCell>{row.MiddleName}</TableCell>
                      <TableCell>{row.CourseYear}</TableCell>
                      <TableCell>{row.Gender}</TableCell>
                      <TableCell>{row.DateOfBirth}</TableCell>
                      <TableCell>{row.HomeAddress}</TableCell>
                      <TableCell>{row.ContactNumber}</TableCell>
                      <TableCell>{row.EmailAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography sx={{ padding: "20px" }}>No matching data found.</Typography>
            )}
          </Box>
        </Box>
      </Box>
  
      {/* Modal for Row Details */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <MuiBox
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">Row Details</Typography>
          {selectedRow &&
            Object.entries(selectedRow).map(([key, value]) => (
              <Typography key={key}>
                <strong>{key}:</strong> {value}
              </Typography>
            ))}
        </MuiBox>
      </Modal>
    </>
  );
  

};

export default UploadStudentFileDetails;