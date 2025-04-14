import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Home/Home'
import Auth from './Auth/Auth'
import Main from './Main/Main'
import CreateEvent from './Main/CreateEvent'
import EventPreview from './Main/EventPreview'
import ScanQRCode from './Main/ScanQRCode'
import Profile from './Main/Profile'
import EditProfile from './Main/EditProfile'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/main" element={<Main />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/event/:eventId" element={<EventPreview />} />
        <Route path="/scan-attendance/:eventId" element={<ScanQRCode />} />
        <Route path="/event/:id" element={<EventPreview />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
      </Routes>
    </Router>
  )
}

export default App
