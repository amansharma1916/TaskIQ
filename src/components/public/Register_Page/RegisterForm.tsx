const RegisterForm = () => {
  return (
    <div className="register-card">
      <h2>Create your free account</h2>
      <p>No credit card required.</p>
      <form className="register-form" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" type="text" placeholder="Jane Founder" />

        <label htmlFor="workEmail">Work email</label>
        <input id="workEmail" name="workEmail" type="email" placeholder="you@startup.com" />

        <label htmlFor="teamSize">Team size</label>
        <select id="teamSize" name="teamSize" defaultValue="">
          <option value="" disabled>Select your team size</option>
          <option value="1-10">1 - 10</option>
          <option value="11-50">11 - 50</option>
          <option value="51-200">51 - 200</option>
          <option value="201+">201+</option>
        </select>

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Create a password" />

        <button className="btn-large primary register-submit" type="submit">
          Create Free Workspace
        </button>
      </form>
    </div>
  )
}

export default RegisterForm
