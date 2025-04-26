import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

//import header and footer
import Header from './components/Header'
import Footer from './components/Footer'

//import pages
import Home from './pages/Home'
import Teams from './pages/Teams'
import Players from './pages/Players'
import TeamPage from './pages/TeamPage'
import PlayerPage from './pages/PlayerPage'
import Matches from './pages/Matches'
import Articles from './pages/Articles'

function App() {

  return (
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Teams" element={<Teams />} />
        <Route path="/Players" element={<Players />} />
        <Route path="/Matches" element={<Matches />} />
        <Route path="/Articles" element={<Articles />} />
        <Route path="/TeamPage/:id" element={<TeamPage />} />
        <Route path="/PlayerPage/:id" element={<PlayerPage />} />
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
      <Footer/>
    </Router>
  )
}

export default App
