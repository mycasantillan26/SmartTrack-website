import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CreateSubjectInformation from '../rightpanel/createSubjectInformation';
import UploadETOFile from '../rightpanel/uploadETOFile';
import ReviewETOFile from '../rightpanel/reviewETOFile';
import ReviewCHEDFile from '../rightpanel/reviewCHEDFile';
import UploadCHEDFile from '../rightpanel/uploadCHEDFile';
import UploadStudentFileDetails from '../rightpanel/uploadStudentFileDetails';

export const steps = [
  {
    label: 'Create Subject Information',
    description: 'Enter subject name, Subject Number, year started, year ended, and semester.',
    route: '/create-subject/:subjectId',
    content: <CreateSubjectInformation />,
  },
  {
    label: 'Upload ETO File',
    description: 'Upload the ETO file with student grades.',
    route: '/upload-eto-file',
    content: <UploadETOFile />,
  },
  {
    label: 'Review ETO File',
    description: 'Check the uploaded ETO file for accuracy.',
    route: '/review-eto-file',
    content: <ReviewETOFile />,
  },
  {
    label: 'Upload CHED File',
    description: 'Upload the CHED file with serial numbers.',
    route: '/upload-ched-file',
    content: <UploadCHEDFile />,
  },
  {
    label: 'Review CHED File',
    description: 'Verify CHED file with serial numbers.',
    route: '/review-ched-file',
    content: <ReviewCHEDFile />,
  },
  {
    label: 'Generate Serial Number',
    description: 'Upload Excel with student details; view, download, or share.',
    route: '/upload-student-details-file',
    content: <UploadStudentFileDetails />,
  },
];

export default function StepperComponent({ activeStep, subjectId, onStepChange }) {
  const navigate = useNavigate();

  const handleStepChange = (stepIndex) => {
    const nextStep = steps[stepIndex];
    if (nextStep) {
      onStepChange(nextStep.content, stepIndex);
      navigate(nextStep.route.replace(':subjectId', subjectId)); // Replace subjectId
    }
  };

  return (
    <Box sx={{ maxWidth: 400, padding: '1rem', backgroundColor: 'maroon', borderRadius: '8px', color: 'white' }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              sx={{
                '& .MuiStepIcon-root': {
                  color: 'gold', // Step icon color
                  '&.Mui-active': {
                    color: 'gold', // Active step icon color
                  },
                  '&.Mui-completed': {
                    color: 'gold', // Completed step icon color
                  },
                },
                '& .MuiStepLabel-label': {
                  color: 'white', // Step text color
                  fontWeight: activeStep === index ? 'bold' : 'normal',
                },
              }}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography sx={{ color: 'white' }}>{step.description}</Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3, backgroundColor: 'maroon', color: 'white' }}>
          <Typography>All steps completed - you&apos;re finished!</Typography>
          <Button
            onClick={() => handleStepChange(0)}
            sx={{
              mt: 1,
              mr: 1,
              backgroundColor: 'gold',
              color: 'maroon',
              '&:hover': {
                backgroundColor: 'darkgoldenrod',
              },
            }}
          >
            Reset
          </Button>
        </Paper>
      )}
    </Box>
  );
}
