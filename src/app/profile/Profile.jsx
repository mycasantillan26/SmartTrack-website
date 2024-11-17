import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth'; 
import { useLocation } from 'react-router-dom'; 
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; 
import './Profile.css'; 
import userPic from '../images/user.png';
import arrowIcon from '../images/arrow.png';
import Loading from '../Loading/Loading'; 
import StepperComponent from '../stepper/Stepper';

const Profile = ({ visible, onClose }) => {
    const location = useLocation(); 
    const userId = new URLSearchParams(location.search).get('userId'); 
    const [userInfo, setUserInfo] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const [authInfo, setAuthInfo] = useState(null); 
    const [editableUserInfo, setEditableUserInfo] = useState({}); 
    const [selectedImage, setSelectedImage] = useState(null); 
    const [profileImageUrl, setProfileImageUrl] = useState(userPic); 
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true); 
            try {
                const db = getFirestore();
                const userDoc = doc(db, 'users', userId);
                const userSnapshot = await getDoc(userDoc);

                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    setUserInfo(userData); 
                    setEditableUserInfo({ 
                        first_name: userData.first_name,
                        middle_name: userData.middle_name || '',
                        last_name: userData.last_name,
                    });

                   
                    if (userData.profileImageUrl) {
                        setProfileImageUrl(userData.profileImageUrl);
                    }
                } else {
                    setError('No such document!'); 
                }

                const auth = getAuth();
                const user = auth.currentUser; 

                if (user && user.uid === userId) {
                    setAuthInfo({ email: user.email });
                } else {
                    setError('User not found in authentication system!');
                }
            } catch (error) {
                setError('Error fetching user data: ' + error.message); 
            } finally {
                setLoading(false); 
            }
        };

        if (userId) {
            fetchUserData(); 
        }
    }, [userId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableUserInfo((prev) => ({ ...prev, [name]: value }));
    };

    const isImageFetched = () => {
        return profileImageUrl && profileImageUrl !== userPic;
    };
    
    const handleImageChange = (e) => {
        if (isImageFetched()) {
            return;
        }
    
        const file = e.target.files[0];
        if (file) {
          
            const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
            if (!validImageTypes.includes(file.type)) {
                alert('Please upload a valid image file (JPEG, JPG, PNG, GIF, WebP).');
                return;
            }
            
            setSelectedImage(file); 
            setProfileImageUrl(URL.createObjectURL(file)); 
        }
    };
    

    const handleSave = async () => {
        setLoading(true);
        try {
            const db = getFirestore();
            const userDocRef = doc(db, 'users', userId);
            let downloadUrl = profileImageUrl;

            if (selectedImage) {
                const storage = getStorage();
                const storageRef = ref(storage, `profileImages/${userId}`);
                await uploadBytes(storageRef, selectedImage);
                downloadUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(userDocRef, {
                first_name: editableUserInfo.first_name,
                middle_name: editableUserInfo.middle_name,
                last_name: editableUserInfo.last_name,
                profileImageUrl: downloadUrl, 
            });

            setProfileImageUrl(downloadUrl); 
            console.log('User info updated successfully!');
            onClose(); 
        } catch (error) {
            console.error('Error updating user info:', error.message);
        } finally {
            setLoading(false); 
        }
    };

    const handleCancel = () => {
        setEditableUserInfo({
            first_name: userInfo.first_name,
            middle_name: userInfo.middle_name || '',
            last_name: userInfo.last_name,
        });
        setProfileImageUrl(userInfo.profileImageUrl || userPic); 
        onClose(); 
    };

    if (loading) {
        return <Loading />; 
    }

    if (error) {
        return <div>Error: {error}</div>; 
    }

    const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
        if (!isOpen) return null;
    
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>Do you want to remove your profile picture?</h3>
                    <button onClick={onConfirm}>Yes</button>
                    <button onClick={onClose}>No</button>
                </div>
            </div>
        );
    };
    
    const handleProfileImageClick = () => {
        
        if (profileImageUrl && profileImageUrl !== userPic) {
            setIsModalOpen(true); 
        }
    };

    const handleImageRemove = async () => {
        try {
            const storage = getStorage();
            const storageRef = ref(storage, `profileImages/${userId}`);
            await deleteObject(storageRef);
            console.log("Profile picture removed successfully.");
            setProfileImageUrl(userPic); 
            setIsModalOpen(false); 
           
            const db = getFirestore();
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, {
                profileImageUrl: null, 
            });
        } catch (error) {
            console.error("Error removing profile picture:", error);
        }
    };
    
    return (
        <>
            {visible && <div className="profile-overlay" style={{ opacity: visible ? 1 : 0 }} />}
            <div className={`profile-container ${visible ? 'slide-in' : 'slide-out'}`} style={{ opacity: visible ? 1 : 0 }}>
                <button className="close-btn" onClick={onClose}>
                    <img src={arrowIcon} alt="Close" className="close-icon" />
                </button>
                <center><h2>Profile</h2></center>
                {userInfo && authInfo && (
                    <div className="profile-info">
                        <div className="profile-layout">
                            <div className="profile-pic-container" style={{ flex: '0 0 31%' }}>
                            <label htmlFor="imageUpload" onClick={handleProfileImageClick}>
                                    <img
                                        src={profileImageUrl && profileImageUrl !== userPic ? profileImageUrl : userPic}
                                        alt="Profile"
                                        className="profile-pic2"
                                        style={{ cursor: 'pointer' }}
                                    />
                                </label>
                                <input
                                    id="imageUpload"
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                    disabled={isImageFetched()} 
                                />
                            </div>
                            <div className="profile-details" style={{ flex: '1' }}>
                                <div>
                                    <strong>Name:</strong> {userInfo.first_name} {userInfo.middle_name} {userInfo.last_name}
                                </div>
                                <div>
                                    <strong>Email:</strong> {authInfo.email}
                                </div>
                            </div>
                        </div>
                        <div className="edit-user-info">
                            <h3>Edit User Information</h3>
                            <input
                                type="text"
                                name="first_name"
                                value={editableUserInfo.first_name}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="middle_name"
                                value={editableUserInfo.middle_name}
                                onChange={handleInputChange}
                            />
                            <input
                                type="text"
                                name="last_name"
                                value={editableUserInfo.last_name}
                                onChange={handleInputChange}
                            />
                            <div>
                                <button onClick={handleSave}>Save</button>
                                <button onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleImageRemove}
                />
            </div>
        </>
    );
};

export default Profile;
