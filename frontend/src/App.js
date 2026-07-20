import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import NovaTriagem from './pages/NovaTriagem';
import Algoritmos from './pages/Algoritmos';
import AlgoritmoDetail from './pages/AlgoritmoDetail';
import Historico from './pages/Historico';
import Tradutor from './pages/Tradutor';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/nova-triagem" replace />} />
            <Route path="nova-triagem" element={<NovaTriagem />} />
            <Route path="algoritmos" element={<Algoritmos />} />
            <Route path="algoritmos/:id" element={<AlgoritmoDetail />} />
            <Route path="tradutor" element={<Tradutor />} />
            <Route path="historico" element={<Historico />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
