import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Step1_PersonalInfo from './Step1_PersonalInfo';
import Step2_CompanyInfo from './Step2_CompanyInfo';
import Step3_FinalStep from './Step3_FinalStep';

const SignUpWizard = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    username: '',
    companyName: '',
    legalStatus: '',
    address: '',
    companyId: '',
    companyEmail: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
   console.log("sending the whole director data ");
   navigate({ to: '/tech-map-route' });
  //  const resp = InscriptionService.signIn(formData);
  //  if (resp) {
  //   console.log("redirecting to Sign in");
  //  } else {
  //     console.log("Show error message")
  //  }


  
  };

  return (
    <>
      {step === 1 && (
        <Step1_PersonalInfo
          formData={formData}
          onChange={handleChange}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2_CompanyInfo
          formData={formData}
          onChange={handleChange}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3_FinalStep
          allFormData={formData}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default SignUpWizard;
