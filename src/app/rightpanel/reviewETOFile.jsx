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
import DashboardNavBar from '../navbar/DashboardNavBar';
import StepperComponent from '../stepper/Stepper';
import arrowIcon from '../images/arrow.png';

const ReviewETOFile = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const fetchData = async () => {
      try {
        const db = getFirestore();
  
        // Fetch uploaded ETO file data
        const fileDocRef = doc(db, "uploadedETOFile", docId);
        const fileDoc = await getDoc(fileDocRef);
  
        if (!fileDoc.exists()) {
          console.warn("Uploaded ETO file not found for docId:", docId);
          setSnackbarMessage("Uploaded ETO file not found.");
          setSnackbarOpen(true);
          return;
        }
  
        const fetchedFileData = fileDoc.data();
        
        // Ensure `uploadedETOFileId` is set in the data
        if (!fetchedFileData.uploadedETOFileId) {
          fetchedFileData.uploadedETOFileId = docId; // Assign the docId as the ETO file ID
        }
        
        setFileData(fetchedFileData);
  
        // Fetch user data
        if (fetchedFileData.userId) {
          const userDocRef = doc(db, "users", fetchedFileData.userId);
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            console.warn("User document not found for ID:", fetchedFileData.userId);
          }
        } else {
          console.warn("No userId found in fetched file data.");
          setSnackbarMessage("No user information associated with the file.");
          setSnackbarOpen(true);
        }
  
        // Fetch subject data using subjectId
        if (fetchedFileData.subjectId) {
          const subjectDocRef = doc(db, "SubjectInformation", fetchedFileData.subjectId);
          const subjectDoc = await getDoc(subjectDocRef);
  
          if (subjectDoc.exists()) {
            const subjectData = subjectDoc.data();
            setSubjectData(subjectData);
  
            // Fetch ListOfStudents using subject information
            const { subjectNumber, semester, academicYear } = subjectData;
            const listPath = `ListOfStudents/${subjectNumber}-${semester}-${academicYear}/students`;
            const studentQuery = collection(db, listPath);
            const studentSnapshot = await getDocs(studentQuery);
  
            if (!studentSnapshot.empty) {
              const studentRows = studentSnapshot.docs.map((doc, index) => ({
                id: index + 1,
                ...doc.data(),
              }));
  
              setRows(studentRows);
            } else {
              console.warn("No students found in ListOfStudents for the specified subject.");
              setSnackbarMessage("No students found for the selected subject.");
              setSnackbarOpen(true);
            }
          } else {
            console.warn("Subject information not found for ID:", fetchedFileData.subjectId);
            setSnackbarMessage("Subject information not found.");
            setSnackbarOpen(true);
          }
        } else {
          console.warn("No subjectId found in fetched file data.");
          setSnackbarMessage("No subject information associated with the file.");
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
        setSnackbarMessage(`Error fetching data: ${error.message}`);
        setSnackbarOpen(true);
      }
    };
  
    fetchData();
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

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleBackClick = () => {
    if (fileData) {
      navigate(`/upload-eto-file/${fileData.subjectId}?userId=${fileData.userId}`);
    }
  };
  const handleNextClick = () => {
    if (!fileData) {
      setSnackbarMessage("File data is missing. Please try again.");
      setSnackbarOpen(true);
      return;
    }
  
    const { uploadedETOFileId, userId } = fileData;
  
    if (uploadedETOFileId && userId) {
      navigate(`/upload-ched-file/${uploadedETOFileId}?userId=${userId}`);
    } else {
      let missingFields = [];
      if (!uploadedETOFileId) missingFields.push("Uploaded ETO File ID");
      if (!userId) missingFields.push("User ID");
  
      setSnackbarMessage(`Incomplete file data. Missing: ${missingFields.join(", ")}.`);
      setSnackbarOpen(true);
    }
  };
  
  
  

  return (
    <>
     <DashboardNavBar
        firstName={userData?.first_name || "Guest"}
        lastName={userData?.last_name || "User"}
        profilePic={userData?.profileImageUrl}
      />

      <Box sx={{ display: 'flex', height: '102vh', padding: '20px', gap: '20px' }}>
        <Box
          sx={{
            flex: '0 0 300px',
            backgroundColor: 'maroon',
            color: 'white',
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <img
              src={arrowIcon}
              alt="Back"
              style={{ cursor: 'pointer', width: '24px', height: '24px', marginRight: '10px' }}
              onClick={() => navigate(`/dashboard`)}
            />
            <Typography variant="h6" sx={{ color: 'gold', fontWeight: 'bold', flex: 1 }}>
              Stepper
            </Typography>
          </Box>
          <StepperComponent activeStep={2} />
        </Box>

        <Box
          sx={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            overflow: 'hidden',
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ color: 'maroon' }}>
            Review ETO File
          </Typography>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
            margin="normal"
            onChange={handleSearchChange}
            sx={{
              marginBottom: '20px',
              backgroundColor: 'gold',
              borderRadius: '4px',
              border: '1px solid maroon',
            }}
          />
          <Box
            sx={{
              overflow: 'auto',
              maxHeight: 'calc(100vh - 250px)',
              backgroundColor: '#fff',
              borderRadius: '4px',
            }}
          >
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableCell
                        key={header.id}
                        sx={{ color: 'white', fontWeight: 'bold', backgroundColor: 'maroon' }}
                      >
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
                    <TableRow
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {headers.map((header) => (
                        <TableCell key={header.id}>{row[header.id]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box
            sx={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'maroon',
                color: 'white',
                fontWeight: 'bold',
                width: '48%',
                '&:hover': { backgroundColor: '#800000' },
              }}
              onClick={handleBackClick}
            >
              Back
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'maroon',
                color: 'white',
                fontWeight: 'bold',
                width: '48%',
                '&:hover': { backgroundColor: '#800000' },
              }}
              onClick={handleNextClick}
            >
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
            bgcolor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
            p: 4,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'maroon',
              mb: 4,
              borderBottom: '2px solid maroon',
              pb: 1,
            }}
          >
            Row Details
          </Typography>

          {selectedRow &&
            headers.map((header) => (
              <Box
                key={header.id}
                sx={{
                  mb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'maroon',
                    fontWeight: 'bold',
                    mb: 1,
                    fontSize: '16px',
                  }}
                >
                  {header.label}
                </Typography>
                <TextField
                  fullWidth
                  value={selectedRow[header.id]}
                  InputProps={{
                    readOnly: true,
                    style: { color: 'maroon', fontWeight: '500', fontSize: '14px' },
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'gold',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: 'gold',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'maroon',
                      },
                    },
                    backgroundColor: '#f9f9f9',
                    borderRadius: '6px',
                  }}
                />
              </Box>
            ))}

          <Button
            onClick={closeModal}
            variant="contained"
            sx={{
              mt: 3,
              display: 'block',
              mx: 'auto',
              backgroundColor: 'maroon',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                backgroundColor: '#800000',
              },
              px: 5,
              py: 1.5,
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default ReviewETOFile;
