import React from 'react'
import NavBar from '../Universe/NavBar'
import eventImage from '../Assets/image.png';
import './Home.css'

const Home = () => {
  return (
    <div className='landing_page'>
      <NavBar />
      <div className='landing-content'>
        <div className='header'>
          <h1 className='header-title'>Oravi</h1>
          <h1 className='header-title'>
            Delightful events <span>start here.</span>
          </h1>
          <h5 className='header-subtitle'>
            Set up an event page, invite friends and sell tickets. Host a memorable event today.
          </h5>
          <button className='cta-button'>Create Your First Event</button>
        </div>
        <img src={eventImage} alt="event illustration" className="landing-image" />
      </div>
    </div>
  )
}

export default Home
