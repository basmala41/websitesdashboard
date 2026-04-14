import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { Navigate } from 'react-router-dom';
import styles from '../../styles/login.module.css';

const Login = () => {
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingUsername, setFetchingUsername] = useState(false);

  const { login, fetchUsername, isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleUserCodeChange = async (e) => {
    const code = e.target.value;
    setUserCode(code);
    setError('');

    if (code.trim()) {
      setFetchingUsername(true);
      const result = await fetchUsername(code);
      if (result.success) {
        setUsername(result.username);
      } else {
        setUsername('');
      }
      setFetchingUsername(false);
    } else {
      setUsername('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userCode || !password) {
      setError('Please enter both user code and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(userCode, password);
    
    if (!result.success) {
      setError(result.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <h1>Genius System</h1>
          <p>Admin Panel Login</p>
        </div>

        {username && (
          <div className={styles.welcomeMessage}>
            <p>Hello, {username}!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="userCode">User Code</label>
            <input
              type="text"
              id="userCode"
              value={userCode}
              onChange={handleUserCodeChange}
              disabled={loading}
              placeholder="Enter your user code"
              className={styles.input}
            />
            {fetchingUsername && (
              <span className={styles.loadingText}>Fetching username...</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter your password"
              className={styles.input}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !userCode || !password}
            className={styles.loginButton}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;