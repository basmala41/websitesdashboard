import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout/Layout';
import Login from './components/Login/Login';
import ProtectPages from './components/ProtectPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectPages />}>
          <Route path="/*" element={<Layout />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;