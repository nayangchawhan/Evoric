import React, { useState, useEffect } from 'react';
import Navbar2 from '../Universe/Nav_bar';
import './CreateEvent.css';
import { realtimeDB, auth } from '../firebase';
import { MdOutlinePublic } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { push, ref as dbRef } from 'firebase/database';

const CreateEvent = () => {
    const [formData, setFormData] = useState({
        name: '',
        tagline: '',
        type: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        registrationDeadlineDate: '',
        registrationDeadlineTime: '',
        maxSeats: '',
        address: '',
        venue: '',
        description: '',
        category: '',
        theme:'',
        additionalInfo: '',
        visibility: 'public',
        isTeamEvent: false, 
        customQuestions: [], 
      });
      

  const [theme, setTheme] = useState('theme-1');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      return alert("You need to be logged in to create an event.");
    }

    const newEvent = {
      ...formData,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      theme: theme,
    };

    const eventRef = await push(dbRef(realtimeDB, 'events'), newEvent);
    const eventId = eventRef.key;
    // Save reference in user's createdEvents
    await push(dbRef(realtimeDB, `users/${currentUser.uid}/createdEvents`), eventId);
    navigate(`/event/${eventRef.key}`);
    alert('Event created successfully!');

    setFormData({
        name: '',
        tagline: '',
        type: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        registrationDeadlineDate: '',
        registrationDeadlineTime: '',
        maxSeats: '',
        address: '',
        venue: '',
        description: '',
        category: '',
        theme:'',
        additionalInfo: '',
        visibility: 'public',
        isTeamEvent: false, // ✅ New Field
        customQuestions: [], // ✅ New Field
    });
  };

  return (
    <div className={`background-page ${theme}`}>
      <Navbar2 />
      <div className="create-event-form">
        <h2>Create New Event</h2>

        <div className="theme-selector">
          <label htmlFor="theme" style={{color:'#444',marginBottom:'5px'}}>Theme</label>
          <select id="theme" value={theme} onChange={handleThemeChange} style={{border:'none'}}>
            <option value="theme-1">Sunset Pink</option>
            <option value="theme-2">Lavender Sky</option>
            <option value="theme-3">Mint Green</option>
            <option value="theme-4">Peach Glow</option>
            <option value="theme-5">Deep Space</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Event Name" value={formData.name} onChange={handleChange} style={{border:'none', fontSize:'24px'}}required />
          <input name="tagline" placeholder="Tag Line" value={formData.tagline} onChange={handleChange} required />
          <input name="type" placeholder="Event Type" value={formData.type} onChange={handleChange} required />

          <label htmlFor="start-date" className="date-label" style={{color:'#444'}}>Start Date</label>
          <input type="date" id="start-date" className="date-input" name="startDate" value={formData.startDate} onChange={handleChange} required />
          <label htmlFor="end-date" className="date-label" style={{color:'#444'}}>End Date</label>
          <input type="date" id="end-date" className="date-input" name="endDate" value={formData.endDate} onChange={handleChange} required />

          <label htmlFor="start-time" className="date-label" style={{color:'#444'}}>Start Time</label>
          <input type="time" id="start-time" className="time-input" name="startTime" value={formData.startTime} onChange={handleChange} required />
          <label htmlFor="end-date" className="date-label" style={{color:'#444'}}>End Time</label>
          <input type="time" id="end-time" className="time-input" name="endTime" value={formData.endTime} onChange={handleChange} required />
          <label htmlFor="reg-deadline-date" className="date-label" style={{ color: '#444' }}>Registration Deadline Date</label>
        <input
        type="date"
        id="reg-deadline-date"
        className="date-input"
        name="registrationDeadlineDate"
        value={formData.registrationDeadlineDate}
        onChange={handleChange}
        required
        />

        <label htmlFor="reg-deadline-time" className="date-label" style={{ color: '#444' }}>Registration Deadline Time</label>
        <input
        type="time"
        id="reg-deadline-time"
        className="time-input"
        name="registrationDeadlineTime"
        value={formData.registrationDeadlineTime}
        onChange={handleChange}
        required
        />

          <input name="maxSeats" placeholder="Maximum Seats" type="number" value={formData.maxSeats} onChange={handleChange} required />
          <input name="address" placeholder="Paste Google Maps Link" value={formData.address} onChange={handleChange} required />
          <input name="venue" placeholder="Venue" value={formData.venue} onChange={handleChange} required />
          <textarea name="description" placeholder="Event Description" value={formData.description} onChange={handleChange} required />

          <select name="category" value={formData.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            <option value="college">College</option>
            <option value="office">Office</option>
            <option value="public">Public</option>
          </select>

          {formData.category === 'college' && (
            <input name="additionalInfo" placeholder="College Name / Department" value={formData.additionalInfo} onChange={handleChange} required />
          )}
          {formData.category === 'office' && (
            <input name="additionalInfo" placeholder="Company Name / Department" value={formData.additionalInfo} onChange={handleChange} required />
          )}
          {formData.category === 'community' && (
            <input name="additionalInfo" placeholder="Community Name" value={formData.additionalInfo} onChange={handleChange} required />
          )}

          <div className="visibility-selector">
            <label htmlFor="visibility">Event Visibility</label>
            <select name="visibility" value={formData.visibility} onChange={handleChange} required>
              <option value="public"><MdOutlinePublic /> Public (Listed when searched)</option>
              <option value="private">Private (Only with link)</option>
            </select>
          </div>

          {/* Team Event Checkbox */}
          <div style={{ marginTop: '10px' }}>
            <label>
                Is this a Team Event?
            </label>
            <input
                type="checkbox"
                name="isTeamEvent"
                checked={formData.isTeamEvent}
                onChange={handleChange}
            />
            </div>


            {/* Custom Questions Field */}
            <div style={{ marginTop: '15px' }}>
            <label htmlFor="customQuestions" style={{ display: 'block', marginBottom: '5px' }}>
                Do you want to ask anything from participants while registering?
            </label>
            <textarea
                placeholder="Add each question in a new line (e.g. Topic Name?, Team Members?)"
                value={formData.customQuestions.join('\n')}
                onChange={(e) =>
                setFormData((prev) => ({
                    ...prev,
                    customQuestions: e.target.value.split('\n').filter(q => q.trim() !== ''),
                }))
                }
                rows={4}
                style={{ width: '100%' }}
            />
            </div>


          <button type="submit">Create Event</button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
