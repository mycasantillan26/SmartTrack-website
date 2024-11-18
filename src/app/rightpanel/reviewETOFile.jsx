import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Snackbar,
  Button,
  TextField,
  Modal,
} from '@mui/material';
import StepperComponent from '../stepper/Stepper'; // Ensure this path is correct

const ReviewETOFile = () => {
  const { docId } = useParams();
  const [fileData, setFileData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedRow, setSelectedRow] = useState(null); // Modal data
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const navigate = useNavigate();

  const headers = [
    { id: 'Count', label: 'Count' },
    { id: 'StudentID', label: 'Student ID' },
    { id: 'StudentName', label: 'Student Name' },
    { id: 'CourseYear', label: 'Course-Year' },
    { id: 'Gender', label: 'Gender' },
    { id: 'SubjectCode', label: 'Subject Code' },
    { id: 'Section', label: 'Section' },
    { id: 'DateOfBirth', label: 'Date of Birth' },
    { id: 'HomeAddress', label: 'Home Address' },
    { id: 'ContactNumber', label: 'Contact Number' },
  ];

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const db = getFirestore();

        const fileDocRef = doc(db, 'uploadedETOFile', docId);
        const fileDoc = await getDoc(fileDocRef);

        if (fileDoc.exists()) {
          const fileData = fileDoc.data();
          setFileData(fileData);

          const subjectDocRef = doc(db, 'SubjectInformation', fileData.subjectId);
          const subjectDoc = await getDoc(subjectDocRef);

          if (subjectDoc.exists()) {
            const subjectData = subjectDoc.data();
            setSubjectData(subjectData);

            const subjectNumber = subjectData.subjectNumber;
            const semester = subjectData.semester;
            const academicYear = subjectData.academicYear;

            const listPath = `ListOfStudents/${subjectNumber}-${semester}-${academicYear}/students`;
            const studentQuery = collection(db, listPath);
            const studentSnapshot = await getDocs(studentQuery);

            if (!studentSnapshot.empty) {
              const studentRows = studentSnapshot.docs.map((doc, index) => ({
                id: index + 1,
                Count: index + 1,
                StudentID: doc.data().StudentID || '',
                StudentName: doc.data().StudentName || '',
                CourseYear: doc.data().CourseYear || '',
                Gender: doc.data().Gender || '',
                SubjectCode: doc.data().SubjectCode || '',
                Section: doc.data().Section || '',
                DateOfBirth: doc.data().DateOfBirth || '',
                HomeAddress: doc.data().HomeAddress || '',
                ContactNumber: doc.data().ContactNumber || '',
              }));

              setRows(studentRows);
            } else {
              setSnackbarMessage('No students found in ListOfStudents for the specified subject.');
              setSnackbarOpen(true);
            }
          } else {
            setSnackbarMessage('Subject information not found.');
            setSnackbarOpen(true);
          }
        } else {
          setSnackbarMessage('Uploaded file metadata not found.');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error fetching student data:', error.message);
        setSnackbarMessage(`Error fetching student data: ${error.message}`);
        setSnackbarOpen(true);
      }
      setLoading(false);
    };

    fetchStudentData();
  }, [docId]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (columnId) => {
    const isAsc = sortColumn === columnId && sortOrder === 'asc';
    const order = isAsc ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortOrder(order);

    const sortedRows = [...rows].sort((a, b) => {
      if (a[columnId] < b[columnId]) return order === 'asc' ? -1 : 1;
      if (a[columnId] > b[columnId]) return order === 'asc' ? 1 : -1;
      return 0;
    });

    setRows(sortedRows);
  };

  const filteredRows = rows.filter((row) =>
    headers.some((header) =>
      row[header.id]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleRowRightClick = (event, row) => {
    event.preventDefault();
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleBackClick = () => {
    if (fileData) {
      navigate(`/upload-eto-file/${fileData.subjectId}`);
    } else {
      navigate('/upload-eto-file');
    }
  };

  const handleNextClick = () => {
    navigate(`/upload-ched-file/${docId}`);
  };

  return (
    <Box sx={{ display: 'flex', padding: '20px', backgroundColor: '#fff', width: '100%', height: '100vh' }}>
      <Box sx={{ flex: '0 0 300px', mr: '20px' }}>
        <StepperComponent activeStep={2} /> {/* Ensure this renders your stepper */}
      </Box>
      <Box sx={{ flex: '1', overflow: 'hidden' }}>
        <Typography variant="h4" gutterBottom>
          Review ETO File
        </Typography>

        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          margin="normal"
          onChange={handleSearchChange}
        />

        {loading ? (
          <p>Loading student data...</p>
        ) : filteredRows.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableCell key={header.id} sortDirection={sortColumn === header.id ? sortOrder : false}>
                      <TableSortLabel
                        active={sortColumn === header.id}
                        direction={sortColumn === header.id ? sortOrder : 'asc'}
                        onClick={() => handleSort(header.id)}
                      >
                        {header.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id} onContextMenu={(e) => handleRowRightClick(e, row)}>
                    {headers.map((header) => (
                      <TableCell key={header.id}>{row[header.id]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <p>No student data available in ListOfStudents.</p>
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

        <Modal open={isModalOpen} onClose={closeModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '50%',
              maxHeight: '80%',
              overflowY: 'auto',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Row Details
            </Typography>
            {selectedRow &&
              headers.map((header) => (
                <Box key={header.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>{header.label}:</strong>
                  </Typography>
                  <TextField
                    fullWidth
                    value={selectedRow[header.id]}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              ))}
            <Button onClick={closeModal} variant="contained" sx={{ mt: 2 }}>
              Close
            </Button>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default ReviewETOFile;
