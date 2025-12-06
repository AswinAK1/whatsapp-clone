import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/home/Home';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';




const App = () => {

    

  return (
    <div className="app-container">

      <Routes>
        <Route path='/' element={<Home/>} />
      </Routes>
      <ToastContainer
        toastClassName="toastify-custom"
        bodyClassName="custom-toast-body"
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default App;
