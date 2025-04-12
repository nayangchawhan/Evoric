import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LuTickets } from "react-icons/lu";
import { IoIosLogIn } from "react-icons/io";
import './NavBar.css'

function NavBar() {
  const navigate = useNavigate(); // Initialize useNavigate

  return (
    <div className='Nav'>
      <h1 className='logo'>Oravi</h1>
      <div className='list'>
      <ul className='nav-list-left'>
        <li><LuTickets /> Events</li>
      </ul>
      <ul className='nav-list-right'>
        <li onClick={() => navigate('/login')}><IoIosLogIn /> Login</li>
      </ul>
      </div>
    </div>
  )
}

export default NavBar