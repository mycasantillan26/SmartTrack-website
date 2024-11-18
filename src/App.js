import React from 'react';
import { Routes, Route } from 'react-router-dom'; 
import LandingPage from './app/landingpage/LandingPage'; 
import SignIn from './app/authentication/SignIn'; 
import SignUp from './app/authentication/SignUp'; 
import Dashboard from './app/dashboard/Dashboard'; 
import ResetPassword from './app/authentication/ResetPassword'; 
import Profile from './app/profile/Profile'; 
import Panel from './app/dashboard/panel';
import UploadETOFile from './app/rightpanel/uploadETOFile';
import ReviewETOFile from './app/rightpanel/reviewETOFile';
import UploadCHEDFile from './app/rightpanel/uploadCHEDFile';
import ReviewCHEDFile from './app/rightpanel/reviewCHEDFile';
import UploadStudentFileDetails from './app/rightpanel/uploadStudentFileDetails';
import CreateSubjectInformation from './app/rightpanel/createSubjectInformation';




const App = () => {
    return (
        <Routes> {/* Only one set of Routes here */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile/:userId" component={Profile} />
            <Route path="/create-subject/:subjectId?" element={<CreateSubjectInformation />} />
            <Route path="/upload-eto-file/:subjectId?" element={<UploadETOFile />} />
            <Route path="/review-eto-file/:docId" element={<ReviewETOFile />} />
            <Route path="/upload-ched-file/:uploadedETOFileId" element={<UploadCHEDFile />} />
            <Route path="/review-ched-file/:documentId" element={<ReviewCHEDFile />} />
            <Route path="/upload-student-details-file" element={<Panel />} />
            
        </Routes>
    );
};

export default App;
