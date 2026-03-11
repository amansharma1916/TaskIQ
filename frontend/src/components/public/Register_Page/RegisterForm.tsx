import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardRouteForRole, saveAuthSession } from '../../../services/auth';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    workEmail: '',
    teamSize: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) {
      setErrorMessage('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.fullName || !formData.companyName || !formData.workEmail || !formData.password) {
      setErrorMessage('Please fill all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.fullName,
        companyName: formData.companyName,
        workEmail: formData.workEmail,
        teamSize: formData.teamSize,
        password: formData.password,
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/ceo/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || `Failed to register: ${response.status}`);
      }

      const session = saveAuthSession(result ?? {});
      setSuccessMessage('Registration successful. Redirecting...');
      setFormData({
        fullName: '',
        companyName: '',
        workEmail: '',
        teamSize: '',
        password: '',
      });
      console.log('Registration successful:', result);
      setTimeout(() => {
        navigate(getDashboardRouteForRole(session.user.role));
      }, 1200);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setErrorMessage(message);
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-card">
      <h2>Create your free account</h2>
      <p>No credit card required.</p>
      <form className="register-form" onSubmit={handleSubmit}>
        {errorMessage && (
          <p className="form-message form-error" role="alert">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="form-message form-success" role="status">{successMessage}</p>
        )}

        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" type="text" placeholder="Founder Name" value={formData.fullName} onChange={handleChange} required />
        
        <label htmlFor="companyName">Company Name</label>
        <input id="companyName" name="companyName" type="text" placeholder="Company Name" value={formData.companyName} onChange={handleChange} required />

        <label htmlFor="workEmail">Work email</label>
        <input id="workEmail" name="workEmail" type="email" placeholder="you@startup.com" value={formData.workEmail} onChange={handleChange} required />

        <label htmlFor="teamSize">Team size</label>
        <select id="teamSize" name="teamSize" value={formData.teamSize} onChange={handleChange}>
          <option value="" disabled>Select your team size</option>
          <option value="1-10">1 - 10</option>
          <option value="11-50">11 - 50</option>
          <option value="51-200">51 - 200</option>
          <option value="201+">201+</option>
        </select>

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} minLength={8} required />

        <button className="btn-large primary register-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Workspace...' : 'Create Free Workspace'}
        </button>
      </form>
    </div>
  )
}

export default RegisterForm
