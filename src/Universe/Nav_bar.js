import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuTickets } from "react-icons/lu";
import { SlCalender } from "react-icons/sl";
import { IoIosLogIn,IoIosMenu  } from "react-icons/io";
import { IoCreateOutline } from "react-icons/io5";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // adjust path as needed
import './Navbar2.css'

function NavBar2() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false); // menu toggle state

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // redirect to login or home page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className='Nav'>
      <h1 className='logo'>Oravi</h1>
      <div className="menu-icon" onClick={() => setShowMenu(!showMenu)}>
        <IoIosMenu size={28} color="white" />
      </div>
      <div className={`list ${showMenu ? 'show' : ''}`}>
        <ul className='nav-list-left'>
          <li><LuTickets /> Events</li>
          <li onClick={() => navigate('/create-event')}><IoCreateOutline /> Create Event</li>
          <li><SlCalender /> Calender</li>
        </ul>
        <ul className='nav-list-right'>
          <li onClick={handleLogout}><IoIosLogIn /> Log out</li>
          <li>Profile</li>
        </ul>
      </div>
    </div>
  )
}

export default NavBar2;
