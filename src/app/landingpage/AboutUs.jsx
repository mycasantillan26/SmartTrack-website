import React from 'react';

const AboutUs = () => {
    return (
        <div 
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                padding: '50px 20px',
                gap: '20px',
            }}
        >
            {/* Left Image Section */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <img
                    src="path-to-your-image.png" // Replace with your actual image path
                    alt="Tracking Illustration"
                    style={{
                        maxWidth: '90%',
                        borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                />
            </div>
            {/* Right Text Section */}
            <div style={{ flex: 1, padding: '20px', textAlign: 'left' }}>
                <h2 style={{ color: 'maroon', fontWeight: 'bold', marginBottom: '20px' }}>About Us</h2>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
                    The <b>NSTP Grade Tracking System</b> provides an efficient way to manage and merge 
                    student grades from the <b>Educational Testing Office (ETO)</b> and the 
                    <b> Commission on Higher Education (CHED)</b>. This system generates a 
                    <b> unique Serial Number</b> for each student by accurately combining 
                    their academic records from both sources.
                </p>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333', marginTop: '10px' }}>
                    By automating grade retrieval, verification, and consolidation, 
                    this solution ensures transparency, accuracy, and efficiency 
                    in grade management. This helps institutions maintain 
                    proper student records and supports smooth academic processing.
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
