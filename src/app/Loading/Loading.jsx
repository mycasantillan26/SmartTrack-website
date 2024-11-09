import React from 'react';
import './Loading.css';

const Loading = () => {
    return (
        <div className="loading-overlay">
            <div className="loading-cat">
                <div className="cat-head">
                    <div className="cat-ears">
                        <div className="cat-ear left-ear"></div>
                        <div className="cat-ear right-ear"></div>
                    </div>
                    <div className="cat-eyes">
                        <div className="cat-eye left-eye">
                            <div className="cat-pupil"></div>
                        </div>
                        <div className="cat-eye right-eye">
                            <div className="cat-pupil"></div>
                        </div>
                    </div>
                    <div className="cat-nose"></div>
                    <div className="cat-mouth"></div>
                    <div className="cat-whiskers">
                        <div className="whisker left"></div>
                        <div className="whisker right"></div>
                    </div>
                </div>
            </div>
            <div className="loading-text">Loading...</div>
        </div>
    );
};

export default Loading;
