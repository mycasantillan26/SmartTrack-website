import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import StepperComponent from '../stepper/Stepper';
import Button from '@mui/material/Button';
import * as XLSX from 'xlsx';

const TableRow = ({ item, columns }) => (
  <tr>
    {columns.map((col, colIndex) => (
      <td key={colIndex} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>
        {item[col] !== undefined ? item[col] : ''}
      </td>
    ))}
  </tr>
);

const ReviewCHEDFile = () => {
  const { documentId } = useParams(); // Correctly get the document ID from URL params
  const [fileData, setFileData] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const storage = getStorage();

  useEffect(() => {
    const fetchFileData = async () => {
        console.log('Document ID:', documentId);

      if (!documentId) {
        setSnackbarMessage('Document ID is not available.');
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const fileDoc = await getDoc(doc(db, 'uploadedCHEDFile', documentId));

        if (fileDoc.exists()) {
          const fileData = fileDoc.data();
          setFileData(fileData);

          console.log('Fetched Document ID:', documentId);
          console.log('File Data:', fileData);

          const { subjectId, fileName } = fileData;

          if (fileName && subjectId) {
            const fileRef = ref(storage, `CHEDFile/${subjectId}/${documentId}/${fileName}`);
            const downloadURL = await getDownloadURL(fileRef);
            fetchAndParseFile(downloadURL);
          } else {
            setSnackbarMessage('File name or subject ID is missing.');
            setSnackbarOpen(true);
          }
        } else {
          setSnackbarMessage('No such document!');
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage('Error fetching document: ' + error.message);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFileData();
  }, [documentId, storage]);

  const fetchAndParseFile = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      console.log('Parsed JSON data:', jsonData);
  
      if (jsonData.length > 0) {
      
      const headers = jsonData[11].map(header => typeof header === 'string' ? header.trim() : header);

      setColumns(headers);
      console.log('Parsed headers:', headers);

      const rowData = jsonData.slice(13).map((row) => {
        const rowObj = {};
        headers.forEach((header, headerIndex) => {
          rowObj[header] = row[headerIndex] !== undefined ? row[headerIndex] : '';
        });
        return rowObj;
      });

  
        console.log('Parsed rows:', rowData);
        setRows(rowData);
      } else {
        setSnackbarMessage('The Excel file is empty or could not be parsed.');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Error fetching or parsing file: ' + error.message);
      setSnackbarOpen(true);
    }
  };
  

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleBackClick = () => {
    if (fileData && fileData.subjectId) {
      navigate(`/upload-ched-file/${fileData.subjectId}`);
    } else {
      setSnackbarMessage('Subject ID is not available.');
      setSnackbarOpen(true);
    }
  };
  
  
  const handleNextClick = () => {
    navigate(`/upload-ched-file`);
  };

  return (
    <Box sx={{ display: 'flex', padding: '20px', backgroundColor: '#fff', width: '100%', height: '100vh' }}>
      <Box sx={{ flex: '0 0 300px', mr: '20px' }}>
        <Typography variant="h6" gutterBottom>
          Stepper
        </Typography>
        <StepperComponent activeStep={4} />
      </Box>
      <Box sx={{ flex: '1', overflow: 'hidden' }}>
        <Typography variant="h4" gutterBottom>
          Review CHED File
        </Typography>
        {loading ? (
          <p>Loading file data...</p>
        ) : fileData ? (
          <Paper style={{ height: 'calc(100vh - 150px)', width: '100%', overflow: 'auto' }}>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {columns.map((col, index) => (
                      <th key={index} style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((item, index) => (
                      <TableRow key={index} item={item} columns={columns} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} style={{ textAlign: 'center' }}>No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Paper>
        ) : (
          <p>No file data available.</p>
        )}

        <Box sx={{ marginTop: '20px' }}>
          <Button variant="contained" color="primary" onClick={handleBackClick} sx={{ marginRight: '10px' }}>
            Back
          </Button>
          <Button variant="contained" color="primary" onClick={handleNextClick}>
            Next
          </Button>
        </Box>

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
