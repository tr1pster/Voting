import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Vote from './components/Vote';
import Results from './components/Results';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Vote />} />
          <Route path="/results" element={<Results />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;