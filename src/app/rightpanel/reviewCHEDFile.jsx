import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
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
} from "@mui/material";
import StepperComponent from "../stepper/Stepper";

const ReviewCHEDFile = () => {
  const { documentId: uploadedETOFileId } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchFirestoreData = async () => {
      if (!uploadedETOFileId) {
        setSnackbarMessage("Uploaded ETO File ID is not available.");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();

        // Fetch `subjectId` from `uploadedETOFile`
        const uploadedFileRef = doc(db, "uploadedETOFile", uploadedETOFileId);
        const uploadedFileDoc = await getDoc(uploadedFileRef);

        if (!uploadedFileDoc.exists()) {
          setSnackbarMessage("Uploaded ETO File not found.");
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }

        const { subjectId } = uploadedFileDoc.data();

        // Fetch Subject Information for path construction
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
          const extractedRows = studentDocs.docs.map((doc, index) => {
            const data = doc.data();
            return {
              "No.": index + 1,
              "Serial No.": data.SerialNo || "",
              AY: data.AY || "",
              Surname: data.Surname || `Surname ${index + 1}`,
              Firstname: data.Firstname || `Firstname ${index + 1}`,
              "Middle Name": data.MiddleName || `MiddleName ${index + 1}`,
            };
          });
          setRows(extractedRows);
          setFilteredRows(extractedRows);
        } else {
          setSnackbarMessage("No student data found.");
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage("Error fetching data: " + error.message);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFirestoreData();
  }, [uploadedETOFileId]);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === "") {
      setFilteredRows(rows);
    } else {
      setFilteredRows(
        rows.filter(
          (row) =>
            row["No."].toString().toLowerCase().includes(query) ||
            row["Serial No."].toLowerCase().includes(query) ||
            row["AY"].toLowerCase().includes(query) ||
            row["Surname"].toLowerCase().includes(query) ||
            row["Firstname"].toLowerCase().includes(query) ||
            (row["Middle Name"] && row["Middle Name"].toLowerCase().includes(query))
        )
      );
    }
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedRows = [...filteredRows].sort((a, b) => {
      const aKey = a[key] || "";
      const bKey = b[key] || "";

      if (aKey.charAt(0) < bKey.charAt(0)) return direction === "asc" ? -1 : 1;
      if (aKey.charAt(0) > bKey.charAt(0)) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredRows(sortedRows);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Left Side: Stepper */}
      <Box
        sx={{
          flex: "0 0 300px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Stepper
        </Typography>
        <StepperComponent activeStep={4} />
      </Box>

      {/* Right Side: Table */}
      <Box sx={{ flex: "1", padding: "20px" }}>
        <Typography variant="h4" gutterBottom>
          Review CHED File
        </Typography>

        {/* Search Bar */}
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchQuery}
          onChange={handleSearch}
        />

        {/* Scrollable Table */}
        {loading ? (
          <Typography>Loading data...</Typography>
        ) : (
          <Paper style={{ height: "calc(100vh - 250px)", overflow: "auto" }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === "No."}
                        direction={sortConfig.key === "No." ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("No.")}
                      >
                        No.
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === "Serial No."}
                        direction={sortConfig.key === "Serial No." ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("Serial No.")}
                      >
                        Serial No.
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === "AY"}
                        direction={sortConfig.key === "AY" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("AY")}
                      >
                        AY
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === "Surname"}
                        direction={sortConfig.key === "Surname" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("Surname")}
                      >
                        Surname
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === "Firstname"}
                        direction={sortConfig.key === "Firstname" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("Firstname")}
                      >
                        Firstname
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === "Middle Name"}
                        direction={sortConfig.key === "Middle Name" ? sortConfig.direction : "asc"}
                        onClick={() => handleSort("Middle Name")}
                      >
                        Middle Name
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row["No."]}</TableCell>
                      <TableCell>{row["Serial No."]}</TableCell>
                      <TableCell>{row["AY"]}</TableCell>
                      <TableCell>{row["Surname"]}</TableCell>
                      <TableCell>{row["Firstname"]}</TableCell>
                      <TableCell>{row["Middle Name"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/upload-ched-file/${uploadedETOFileId}`)}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate(`/upload-student-details-file`)}
          >
            Next
          </Button>
        </Box>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
        />
      </Box>
    </Box>
  );
};

export default ReviewCHEDFile;
