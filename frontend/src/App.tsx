import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

//import header and footer
import Header from './components/Header'
import Footer from './components/Footer'

//import pages
import Home from './pages/Home'
import Teams from './pages/Teams'

function App() {

  return (
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Teams" element={<Teams />} />
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
      <Footer/>
    </Router>
    //footer
  )
}

export default App
