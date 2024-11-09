import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable'; // Import the resizable box
import StepperComponent from './Stepper'; // Adjust the path as necessary
import 'react-resizable/css/styles.css'; // Include styles for resizable component
import Box from '@mui/material/Box';

const ResizableStepper = ({ activeStep, onStepChange }) => {
  const [width, setWidth] = useState(300); // Initial width

  return (
    <Box sx={{ display: 'flex' }}>
      <ResizableBox
        width={width}
        height={300} // Fixed height; adjust as necessary
        minConstraints={[200, 300]} // Minimum width and height
        maxConstraints={[600, 300]} // Maximum width and height
        axis="x" // Restrict resizing to the x-axis
        onResizeStop={(e, data) => {
          setWidth(data.size.width); // Update width on resize
        }}
        handle={<span className="custom-handle" style={{ cursor: 'ew-resize', marginLeft: '5px' }} />}
      >
        <Box sx={{ padding: '1rem' }}>
          <StepperComponent activeStep={activeStep} onStepChange={onStepChange} />
        </Box>
      </ResizableBox>
      {/* Here you can add other components, like the UploadETOFile, if needed */}
    </Box>
  );
};

export default ResizableStepper;
