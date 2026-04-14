import React from 'react'
import styles from '../styles/sidebar.module.css';
import useAuthStore from '../store/authStore';
const Header = () => {
  const { user, logout ,appOptions} = useAuthStore();
  const handleLogout = () => {
    logout();
  };
  return (
    <>
        <header className={styles.header}>
            <div className={styles.logo}>
              Genius System (Admin Panel)
            </div>
            <div className={styles.headerActions}>
              {user && (
                <span className={styles.welcomeText}>
                  Welcome, {user.username}
                </span>
              )}
              <button 
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </header>
    </>
  )
}

export default Header
