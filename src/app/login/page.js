"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import "../../styles/login.css";

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        throw new Error(data?.message || `Request failed: ${res.status}`);
      }

      // Token is returned and also set as httpOnly cookie
      if (data?.token) {
        localStorage.setItem('token', data.token); // optional if you rely on the cookie
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <Image height={500} width={500} src='/test.png' alt='lynx logo' />
      <div className='form-container'>
        <h1 className='title'>Login</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form className='form' onSubmit={handleSubmit}>
          <div className='input-group'>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <br />
          <div className='input-group'>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <br />
          <button type="submit" className='sign lynx-bg'>
            {loading ? (
              <div className="loader-card">
                <div className="loader">
                  <p>loading</p>
                  <div className="words">
                    <span className="word">projects</span>
                    <span className="word">employees</span>
                    <span className="word">resources</span>
                    <span className="word">travel</span>
                  </div>
                </div>
              </div>
            ) : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
