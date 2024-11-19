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
  Modal,
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
  const [selectedRow, setSelectedRow] = useState(null); // For storing selected row details
  const [modalOpen, setModalOpen] = useState(false); // For modal visibility

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

        const uploadedFileRef = doc(db, "uploadedETOFile", uploadedETOFileId);
        const uploadedFileDoc = await getDoc(uploadedFileRef);

        if (!uploadedFileDoc.exists()) {
          setSnackbarMessage("Uploaded ETO File not found.");
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }

        const { subjectId } = uploadedFileDoc.data();

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
              Surname: data.Surname || "",
              Firstname: data.Firstname || "",
              "Middle Name": data.MiddleName || "",
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

      if (!isNaN(aKey) && !isNaN(bKey)) {
        return direction === "asc" ? aKey - bKey : bKey - aKey;
      }

      return direction === "asc"
        ? String(aKey).localeCompare(String(bKey))
        : String(bKey).localeCompare(String(aKey));
    });

    setFilteredRows(sortedRows);
  };

  const handleRowRightClick = (event, row) => {
    event.preventDefault(); // Prevent context menu from opening
    setSelectedRow(row); // Set selected row details
    setModalOpen(true); // Open modal
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box sx={{ flex: "0 0 300px", padding: "20px", backgroundColor: "#f5f5f5" }}>
        <Typography variant="h6" gutterBottom>
          Stepper
        </Typography>
        <StepperComponent activeStep={4} />
      </Box>

      <Box sx={{ flex: "1", padding: "20px" }}>
        <Typography variant="h4" gutterBottom>
          Review CHED File
        </Typography>

        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchQuery}
          onChange={handleSearch}
        />

        {loading ? (
          <Typography>Loading data...</Typography>
        ) : (
          <Paper style={{ height: "calc(100vh - 250px)", overflow: "auto" }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(rows[0] || {}).map((key) => (
                      <TableCell key={key}>
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
                      onContextMenu={(event) => handleRowRightClick(event, row)}
                      style={{ cursor: "context-menu" }}
                    >
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

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

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
        />

        <Modal open={modalOpen} onClose={handleCloseModal}>
          <Box
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
            <Typography variant="h6" gutterBottom>
              Row Details
            </Typography>
            {selectedRow &&
              Object.entries(selectedRow).map(([key, value]) => (
                <TextField
                  key={key}
                  label={key}
                  value={value}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              ))}
            <Button variant="contained" fullWidth onClick={handleCloseModal}>
              Close
            </Button>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default ReviewCHEDFile;
