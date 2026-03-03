import { useState } from 'react';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    workEmail: '',
    teamSize: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.fullName,
        companyName: formData.companyName,
        workEmail: formData.workEmail,
        teamSize: formData.teamSize,
        password: formData.password,
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Failed to register: ${response.status}`);
      }
      const result = await response.json();
      console.log('Registration successful:', result);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="register-card">
      <h2>Create your free account</h2>
      <p>No credit card required.</p>
      <form className="register-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" type="text" placeholder="Founder Name" value={formData.fullName} onChange={handleChange} />
        
        <label htmlFor="companyName">Company Name</label>
        <input id="companyName" name="companyName" type="text" placeholder="Company Name" value={formData.companyName} onChange={handleChange} />

        <label htmlFor="workEmail">Work email</label>
        <input id="workEmail" name="workEmail" type="email" placeholder="you@startup.com" value={formData.workEmail} onChange={handleChange} />

        <label htmlFor="teamSize">Team size</label>
        <select id="teamSize" name="teamSize" value={formData.teamSize} onChange={handleChange}>
          <option value="" disabled>Select your team size</option>
          <option value="1-10">1 - 10</option>
          <option value="11-50">11 - 50</option>
          <option value="51-200">51 - 200</option>
          <option value="201+">201+</option>
        </select>

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} />

        <button className="btn-large primary register-submit" type="submit">
          Create Free Workspace
        </button>
      </form>
    </div>
  )
}

export default RegisterForm
