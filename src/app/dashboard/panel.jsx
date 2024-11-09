import React from 'react';
import Box from '@mui/material/Box';

const Panel = ({ children }) => {
  return (
    <Box
      sx={{
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginLeft: '20px',
        flex: '1', 
      }}
    >
      {children}
    </Box>
  );
};

export default Panel;
