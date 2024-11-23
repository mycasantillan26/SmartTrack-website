import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'; // Import signOut
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardNavBar from '../navbar/DashboardNavBar';
import Profile from '../profile/Profile';
import './Dashboard.css';
import Loading from '../Loading/Loading';
import TextField from '@mui/material/TextField';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false); // State for logout modal
    const [searchQuery, setSearchQuery] = useState('');
    const [rightPanelContent, setRightPanelContent] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]); // State to hold filtered subjects

    const fetchUserData = async (userId) => {
        const db = getFirestore();
        const userDoc = doc(db, 'users', userId);
        try {
            const userSnapshot = await getDoc(userDoc);
            if (userSnapshot.exists()) {
                const userData = { ...userSnapshot.data(), id: userId };
                console.log("Fetched User Data:", userData);
                setUser(userData);
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
            setFilteredSubjects(subjectsData); // Initialize filtered subjects with all subjects
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

    const handleLogout = () => {
        setLogoutModalVisible(true); // Show logout confirmation modal
    };

    const confirmLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth); // Log out the user
            navigate('/signin'); // Redirect to sign-in page
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            setLogoutModalVisible(false); // Close the modal
        }
    };

    const cancelLogout = () => {
        setLogoutModalVisible(false); // Close the modal without logging out
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Filter subjects based on the search query
        const filtered = subjects.filter(subject => 
            subject.subjectName.toLowerCase().includes(query.toLowerCase()) ||
            subject.subjectNumber.toLowerCase().includes(query.toLowerCase()) ||
            subject.academicYear.toLowerCase().includes(query.toLowerCase()) ||
            subject.semester.toLowerCase().includes(query.toLowerCase())
        );

        setFilteredSubjects(filtered); // Update filtered subjects state
    };

    const highlightText = (text) => {
        if (!searchQuery) return text;

        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.split(regex).map((part, index) => 
            part.toLowerCase() === searchQuery.toLowerCase() ? 
                <span key={index} style={{ backgroundColor: 'gold', fontWeight: 'bold' }}>{part}</span> : 
                part
        );
    };

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return <div>Please log in to access the dashboard.</div>;
    }

    return (
        <div className="dashboard-container">
            <DashboardNavBar
                firstName={user.first_name}
                lastName={user.last_name}
                profilePic={user.profileImageUrl}
                onProfileClick={() => setProfileVisible(true)}
                onLogoutClick={handleLogout} // Pass the logout handler
            />
            <Profile
                visible={isProfileVisible}
                onClose={() => setProfileVisible(false)}
            />

            <div className="dashboard-content">
                <div className="subject-actions">
             

                        <div className="search-container" style={{ width: '100%', padding: '10px 0' }}>
                            <TextField
                                variant="outlined"
                                placeholder="Search ..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'maroon', 
                                    color: 'black', 
                                    borderRadius: '5px',
                                }}
                                InputProps={{
                                    style: {
                                        color: 'white', 
                                    },
                                }}
                                InputLabelProps={{
                                    style: { color: 'gold' }, // Black placeholder text color
                                }}
                            />
                 

                        <i className="fas fa-search search-icon"></i>
                                                {user && (
                            <button
                                onClick={() => navigate(`/create-subject?userId=${encodeURIComponent(user?.id)}`)}
                                className="create-subject-button"
                                style={{
                                    backgroundColor: 'maroon',
                                    color: 'gold',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginTop: '20px',
                                }}
                            >
                                Create Subject Information
                            </button>
                        )}



                    </div>
                </div>

                <div 
                        className="cardcontainer" 
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '20px',
                            padding: '10px',
                            justifyContent: 'center',
                        }}
                    >
                        {filteredSubjects.map((subject) => (
                            <div 
                                key={subject.id} 
                                className="subject-card"
                                style={{
                                    backgroundColor: 'maroon',
                                    color: 'white',
                                    border: '2px solid gold',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease', // Smooth transition for animation
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)'; // Slightly enlarge the card
                                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)'; // Increase shadow on hover
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)'; // Reset to original size
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // Reset shadow
                                }}
                            >
                                <p style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    {highlightText(subject.subjectName)}
                                </p>
                                <p style={{ fontSize: '14px' }}>{highlightText(subject.subjectNumber)}</p>
                                <p style={{ fontSize: '14px' }}>{highlightText(subject.academicYear)}</p>
                                <p style={{ fontSize: '14px' }}>
                                    {highlightText(
                                        subject.semester === '1st sem'
                                            ? 'First Semester'
                                            : subject.semester === '2nd sem'
                                            ? 'Second Semester'
                                            : subject.semester
                                    )}
                                </p>
                                <button
                                onClick={() => navigate(`/create-subject/${subject.id}?userId=${user.id}`)}
                                style={{
                                    backgroundColor: 'gold',
                                    color: 'maroon',
                                    height: '40px',
                                    width: '100%',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                Continue
                            </button>

                            </div>
                        ))}
                    </div>

            </div>

            {isLogoutModalVisible && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 3,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            textAlign: 'center',
                            color: 'maroon', // Text color updated to maroon
                        }}
                    >
                        <p>Are you sure you want to log out?</p>
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={confirmLogout}
                                style={{
                                    marginRight: '10px',
                                    cursor: 'pointer',
                                    backgroundColor: 'maroon', // Button background color
                                    color: 'gold', // Button text color
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                }}
                            >
                                Yes
                            </button>
                            <button
                                onClick={cancelLogout}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: 'gold', // Button background color
                                    color: 'maroon', // Button text color
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                }}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
