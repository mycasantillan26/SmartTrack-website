import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  TableSortLabel,
  Snackbar,
  Box,
  Typography,
  Button,
  Modal,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import StepperComponent from "../stepper/Stepper";
import DashboardNavBar from "../navbar/DashboardNavBar";
import arrowIcon from "../images/arrow.png";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const ReviewCHEDFile = () => {
  const { uploadedETOFileId, userId } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setSnackbarMessage("User ID is missing. Cannot fetch user data.");
        setSnackbarOpen(true);
        return;
      }

      try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setSnackbarMessage("User not found.");
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage(`Error fetching user data: ${error.message}`);
        setSnackbarOpen(true);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!uploadedETOFileId) {
        setSnackbarMessage("Uploaded ETO File ID is missing.");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const uploadedFileRef = doc(db, "uploadedETOFile", uploadedETOFileId);
        const uploadedFileDoc = await getDoc(uploadedFileRef);

        if (!uploadedFileDoc.exists()) {
          setSnackbarMessage("Uploaded ETO File not found.");
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }

        const { subjectId } = uploadedFileDoc.data();
        if (!subjectId) {
          setSnackbarMessage("Subject ID is missing in the uploaded file.");
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }

        const subjectDocRef = doc(db, "SubjectInformation", subjectId);
        const subjectDoc = await getDoc(subjectDocRef);

        if (!subjectDoc.exists()) {
          setSnackbarMessage("Subject information not found.");
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }

        const { subjectNumber, semester, academicYear } = subjectDoc.data();
        const basePath = `StudentwithSerialNumber/${subjectNumber}-${semester}-${academicYear}/student`;
        const studentCollection = collection(db, basePath);
        const studentDocs = await getDocs(studentCollection);

        if (!studentDocs.empty) {
          const extractedRows = studentDocs.docs.map((doc, index) => ({
            "No.": index + 1,
            "Serial No.": doc.data().SerialNo || "",
            AY: doc.data().AY || "",
            Surname: doc.data().Surname || "",
            Firstname: doc.data().Firstname || "",
            "Middle Name": doc.data().MiddleName || "",
          }));
          setRows(extractedRows);
          setFilteredRows(extractedRows);
        } else {
          setSnackbarMessage("No student data found.");
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage(`Error fetching data: ${error.message}`);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [uploadedETOFileId]);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query) {
      setFilteredRows(rows);
    } else {
      setFilteredRows(
        rows.filter((row) =>
          Object.values(row).some((value) =>
            value.toString().toLowerCase().includes(query)
          )
        )
      );
    }
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedRows = [...filteredRows].sort((a, b) => {
      const aValue = a[key] || "";
      const bValue = b[key] || "";

      if (!isNaN(aValue) && !isNaN(bValue)) {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setFilteredRows(sortedRows);
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleNext = () => {
    navigate(
      `/upload-student-details-file/${uploadedETOFileId}?userId=${userId}&uploadedCHEDFileId=${uploadedETOFileId}`
    );
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  return (
    <>
      {/* NavBar */}
      {userData && (
        <DashboardNavBar
          firstName={userData.first_name || "Guest"}
          lastName={userData.last_name || "User"}
          profilePic={userData.profileImageUrl || ""}
        />
      )}

      {/* Main Content */}
      <Box sx={{ display: "flex", height: "100vh", padding: "20px", gap: "20px" }}>
        <Box
          sx={{
            flex: "0 0 300px",
            backgroundColor: "maroon",
            color: "white",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <img
              src={arrowIcon}
              alt="Back"
              style={{ cursor: "pointer", width: "24px", height: "24px", marginRight: "10px" }}
              onClick={() => navigate(`/dashboard`)}
            />
            <Typography variant="h6" sx={{ color: "gold", fontWeight: "bold", flex: 1 }}>
              Stepper
            </Typography>
          </Box>
          <StepperComponent activeStep={4} />
        </Box>

        {/* Table and Search */}
        <Box sx={{ flex: 1, padding: "20px" }}>
          <Typography variant="h4" sx={{ color: "maroon", marginBottom: "20px" }}>
            Review CHED File
          </Typography>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchQuery}
            onChange={handleSearch}
            sx={{
              "& .MuiInputBase-input": { color: "yellow" },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "maroon",
                "& fieldset": { borderColor: "gold" },
                "&:hover fieldset": { borderColor: "gold" },
              },
              "& .MuiInputLabel-root": { color: "gold" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "gold" }} />
                </InputAdornment>
              ),
            }}
          />
          {loading ? (
            <Typography>Loading data...</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(rows[0] || {}).map((key) => (
                      <TableCell
                        key={key}
                        sx={{ backgroundColor: "maroon", color: "white", fontWeight: "bold" }}
                      >
                        <TableSortLabel
                          active={sortConfig.key === key}
                          direction={sortConfig.key === key ? sortConfig.direction : "asc"}
                          onClick={() => handleSort(key)}
                        >
                          {key}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row, index) => (
                    <TableRow
                      key={index}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: "pointer" }}
                    >
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "maroon",
                color: "white",
                fontWeight: "bold",
                width: "48%",
                "&:hover": { backgroundColor: "#800000" },
              }}
              onClick={() => navigate(`/upload-ched-file/${uploadedETOFileId}`)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "maroon",
                color: "white",
                fontWeight: "bold",
                width: "48%",
                "&:hover": { backgroundColor: "#800000" },
              }}
              onClick={handleNext}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Modal for Row Details */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            bgcolor: "white",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "maroon", marginBottom: 2 }}>
            Row Details
          </Typography>
          {selectedRow &&
            Object.entries(selectedRow).map(([key, value]) => (
              <TextField
                key={key}
                label={key}
                value={value}
                fullWidth
                margin="normal"
                variant="outlined"
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  "& .MuiInputBase-input": { color: "maroon" },
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "gold",
                    "& fieldset": { borderColor: "maroon" },
                    "&:hover fieldset": { borderColor: "maroon" },
                  },
                  "& .MuiInputLabel-root": { color: "maroon" },
                }}
              />
            ))}
          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "maroon",
              color: "white",
              fontWeight: "bold",
              mt: 2,
              "&:hover": { backgroundColor: "#800000" },
            }}
            onClick={handleCloseModal}
          >
            Close
          </Button>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </>
  );
};

export default ReviewCHEDFile;
