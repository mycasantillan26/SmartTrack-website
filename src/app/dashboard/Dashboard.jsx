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
            />
            <Profile
                visible={isProfileVisible}
                onClose={() => setProfileVisible(false)}
            />

            <div className="dashboard-content">
                <div className="subject-actions">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search ..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="subject-search"
                        />
                        <i className="fas fa-search search-icon"></i>
                        <button onClick={() => navigate('/create-subject')} className="create-subject-button">
                            Create Subject Information
                        </button>
                    </div>
                </div>

                <div className="cardcontainer">
                    {filteredSubjects.map((subject) => (
                        <div key={subject.id} className="subject-card">
                            <p>{highlightText(subject.subjectName)}</p>
                            <p>{highlightText(subject.subjectNumber)}</p>
                            <p>{highlightText(subject.academicYear)}</p>
                            <p>{highlightText(subject.semester === '1st sem' ? 'First Semester' : subject.semester === '2nd sem' ? 'Second Semester' : subject.semester)}</p>
                            <button 
                                onClick={() => navigate(`/create-subject/${subject.id}`)} 
                                className="continue-button"
                                style={{backgroundColor: 'gold', color: 'maroon', height: '30px', borderRadius: '5px', cursor: 'pointer'}}
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
