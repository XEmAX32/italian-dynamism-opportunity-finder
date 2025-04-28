import React from 'react'
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import Index from "./pages/Index/Index.tsx";
import Details from "./pages/Details/Details.tsx";
import Opportunities from './pages/Opportunities/Opportunities.tsx';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<Navigate to="/"/>} />
        <Route path="/d/:opportunityId" element={<Details />} />
        <Route path="/opportunities" element={<Opportunities />} />
      </Routes>
    </Router>
  )
}

export default App;
