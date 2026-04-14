import React from 'react';
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from '../store/authStore';

const ProtectPages = () => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectPages;