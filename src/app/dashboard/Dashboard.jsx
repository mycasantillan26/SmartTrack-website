import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardNavBar from '../navbar/DashboardNavBar';
import Profile from '../profile/Profile';
import './Dashboard.css';
import Loading from '../Loading/Loading';
import CreateSubjectInformation from '../rightpanel/createSubjectInformation';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [showStepper, setShowStepper] = useState(false);
    const [stepperExpanded, setStepperExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [rightPanelContent, setRightPanelContent] = useState(null);
    const [subjects, setSubjects] = useState([]);

    const getQueryParams = () => {
        const params = new URLSearchParams(location.search);
        const subjectName = params.get('subjectName') || '';
        const academicYear = params.get('academicYear') || '';
        return { subjectName, academicYear };
    };

    const fetchUserData = async (userId) => {
        const db = getFirestore();
        const userDoc = doc(db, 'users', userId);
        try {
            const userSnapshot = await getDoc(userDoc);
            if (userSnapshot.exists()) {
                const userData = { ...userSnapshot.data(), id: userId };
                setUser(userData);  // Set user data
                const { first_name, last_name } = userData;
    
                window.history.pushState({}, '', `?firstName=${first_name}&lastName=${last_name}&userId=${userId}`);
                localStorage.setItem('firstName', first_name);
                localStorage.setItem('lastName', last_name);
    
         
                await fetchSubjectInformation(userId);
            } else {
                console.log('No such document!');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false); 
        }
    };

    const fetchSubjectInformation = async (userId) => {
        const db = getFirestore();
        const subjectsRef = collection(db, 'SubjectInformation');
        const q = query(subjectsRef, where('userId', '==', userId));
        try {
            const querySnapshot = await getDocs(q);
            const subjectsData = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id
            }));
            setSubjects(subjectsData); 
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                fetchUserData(currentUser.uid);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                fetchUserData(currentUser.uid); 
            } else {
                setUser(null);
                setLoading(false);  
            }
        });
    
        return () => unsubscribe();
    }, []);
    

    const handleProfileClick = () => {
        setProfileVisible(true);
    };

    const handleCloseProfile = () => {
        setProfileVisible(false);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleCreateSubjectClick = () => {
        navigate('/create-subject');
    };

    const handleArrowClick = () => {
        setStepperExpanded((prevState) => !prevState);
    };

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return <div>Please log in to access the dashboard.</div>;
    }

    const { first_name: firstName, last_name: lastName, profileImageUrl } = user;

    return (
        <div className="dashboard-container">
            <DashboardNavBar
                firstName={firstName}
                lastName={lastName}
                profilePic={profileImageUrl}
                onProfileClick={handleProfileClick}
            />
            <Profile
                visible={isProfileVisible}
                onClose={handleCloseProfile}
            />

            <div className="dashboard-content">
                
                    <div className="subject-actions">
                        <input
                            type="text"
                            placeholder="Search subject..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="subject-search"
                        />
                        <button onClick={handleCreateSubjectClick} className="create-subject-button">
                            Create Subject Information
                        </button>
                    </div>
                
                    <div className="cardcontainer">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="subject-card">
                            <p>Subject Name: {subject.subjectName}</p>
                            <p>Subject Number: {subject.subjectNumber}</p>
                            <p>Academic Year: {subject.academicYear}</p>
                            <p>Semester: {subject.semester}</p>
                            <button 
                                onClick={() => navigate(`/create-subject/${subject.id}`)} 
                                className="continue-button"
                                style={{backgroundColor: 'gold',color:'maroon',height: '30px',borderRadius: '5px',cursor:'pointer'}}
                            >
                                Continue
                            </button>
                        </div>
 

                        ))}
                    </div>
                  
                    
                
            </div>
        </div>
    );
};

export default Dashboard;
