import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, query, where, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import StepperComponent from "../stepper/Stepper";
import Button from "@mui/material/Button";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

const HEADER_COLUMNS = ["No.", "Serial No.", "AY", "Surname", "Firstname", "Middle Name"];

const TableRow = ({ item }) => (
  <tr>
    {HEADER_COLUMNS.map((col, index) => (
      <td key={index} style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>
        {item[col] || ""}
      </td>
    ))}
  </tr>
);

const ReviewCHEDFile = () => {
  const { documentId: uploadedETOFileId } = useParams();
  const [fileData, setFileData] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const storage = getStorage();

  useEffect(() => {
    const fetchFileData = async () => {
      if (!uploadedETOFileId) {
        setSnackbarMessage("Uploaded ETO File ID is not available.");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const q = query(
          collection(db, "uploadedCHEDFile"),
          where("uploadedETOFileId", "==", uploadedETOFileId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const fileDoc = querySnapshot.docs[0];
          const fileData = fileDoc.data();
          setFileData(fileData);

          const { fileName, uploadedETOFileId } = fileData;
          const fileRef = ref(storage, `CHEDFile/${uploadedETOFileId}/${fileName}`);
          const fileURL = await getDownloadURL(fileRef);

          await fetchAndParsePDF(fileURL);
        } else {
          setSnackbarMessage("No document found for the provided Uploaded ETO File ID.");
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage("Error fetching document: " + error.message);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFileData();
  }, [uploadedETOFileId]);

  const fetchAndParsePDF = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch PDF from the server.");
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;

      const extractedRows = [];
      let headerDetected = false;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const rowsByYCoord = groupTextByYCoord(textContent.items);

        rowsByYCoord.forEach((row) => {
          const rowText = row.map((item) => item.str.trim()).filter(Boolean);

          console.log("Raw Row Text:", rowText);

          if (!headerDetected && isHeaderRow(rowText)) {
            headerDetected = true;
          } else if (headerDetected) {
            const rowData = mapRowToHeaders(rowText);
            if (rowData) {
              console.log("Mapped Row:", rowData);
              extractedRows.push(rowData);
            }
          }
        });
      }

      if (extractedRows.length > 0) {
        setRows(extractedRows);
      } else {
        setSnackbarMessage("No valid data rows found in the PDF.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("Error parsing PDF: " + error.message);
      setSnackbarOpen(true);
    }
  };

  const groupTextByYCoord = (items) => {
    const rows = [];
    let currentRow = [];
    let lastY = null;

    items.forEach((item) => {
      if (!item.str.trim()) return; // Skip empty strings
      if (lastY === null) lastY = item.transform[5];

      if (Math.abs(item.transform[5] - lastY) > 5) {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
      }

      currentRow.push(item);
      lastY = item.transform[5];
    });

    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
  };

  const isHeaderRow = (rowText) => {
    const normalizedRow = rowText.join(" ").toLowerCase();
    const normalizedHeader = HEADER_COLUMNS.join(" ").toLowerCase();
    return normalizedRow.includes(normalizedHeader);
  };

  const mapRowToHeaders = (rowText) => {
    const rowData = {};
    HEADER_COLUMNS.forEach((header, index) => {
      rowData[header] = rowText[index] || "";
    });

    return rowData;
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleNextClick = () => {
    navigate(`/next-step`);
  };

  return (
    <Box sx={{ display: "flex", padding: "20px", backgroundColor: "#fff", width: "100%", height: "100vh" }}>
      <Box sx={{ flex: "0 0 300px", mr: "20px" }}>
        <Typography variant="h6" gutterBottom>
          Stepper
        </Typography>
        <StepperComponent activeStep={4} />
      </Box>
      <Box sx={{ flex: "1", overflow: "hidden" }}>
        <Typography variant="h4" gutterBottom>
          Review CHED File
        </Typography>
        {loading ? (
          <p>Loading file data...</p>
        ) : fileData ? (
          <Paper style={{ height: "calc(100vh - 150px)", width: "100%", overflow: "auto" }}>
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    {HEADER_COLUMNS.map((header) => (
                      <th key={header} style={{ padding: "10px", textAlign: "center", border: "1px solid #ddd" }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((item, index) => <TableRow key={index} item={item} />)
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        No data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Paper>
        ) : (
          <p>No file data available.</p>
        )}
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
