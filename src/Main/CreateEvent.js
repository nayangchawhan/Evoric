import React, { useState, useEffect } from 'react';
import Navbar2 from '../Universe/Nav_bar';
import './CreateEvent.css';
import { realtimeDB, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { push, ref as dbRef } from 'firebase/database';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    startDate: '',
    endDate: '',
    maxSeats: '',
    address: '',
    venue: '',
    description: '',
    category: '',
    additionalInfo: '',
    visibility: 'public',
  });
  
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  // Fetch current user info when the component mounts
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
    } else {
      navigate("/login"); // Redirect to login if the user is not logged in
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure the current user is authenticated
    if (!currentUser) {
      return alert("You need to be logged in to create an event.");
    }

    const newEvent = {
      ...formData,
      createdBy: currentUser.uid,  // Add the UID of the current user as the event creator
      createdAt: new Date().toISOString(),
    };

    // Push the event data to Firebase Realtime Database under the 'events' node
    const eventRef = await push(dbRef(realtimeDB, 'events'), newEvent);

    // After event is created, navigate to the event preview page
    navigate(`/event/${eventRef.key}`);
    alert('Event created successfully!');

    // Clear the form after submission
    setFormData({
      name: '',
      type: '',
      startDate: '',
      endDate: '',
      maxSeats: '',
      address: '',
      venue: '',
      description: '',
      category: '',
      additionalInfo: '',
      visibility: 'public',
    });
  };

  return (
    <div>
      <Navbar2 />
      <div className="create-event-form">
        <h2>Create New Event</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Event Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            name="type"
            placeholder="Event Type"
            value={formData.type}
            onChange={handleChange}
            required
          />
          <label htmlFor="start-date" className="date-label">Start Date</label>
          <input
            type="date"
            id="start-date"
            className="date-input"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
          <label htmlFor="end-date" className="date-label">End Date</label>
          <input
            type="date"
            id="end-date"
            className="date-input"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
          <input
            name="maxSeats"
            placeholder="Maximum Seats"
            type="number"
            value={formData.maxSeats}
            onChange={handleChange}
            required
          />
          <input
            name="address"
            placeholder="Paste Google Maps Link"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <input
            name="venue"
            placeholder="Venue"
            value={formData.venue}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Event Description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="college">College</option>
            <option value="office">Office</option>
            <option value="community">Community</option>
          </select>

          {formData.category === 'college' && (
            <input
              name="additionalInfo"
              placeholder="College Name / Department"
              value={formData.additionalInfo}
              onChange={handleChange}
              required
            />
          )}
          {formData.category === 'office' && (
            <input
              name="additionalInfo"
              placeholder="Company Name / Department"
              value={formData.additionalInfo}
              onChange={handleChange}
              required
            />
          )}
          {formData.category === 'community' && (
            <input
              name="additionalInfo"
              placeholder="Community Name"
              value={formData.additionalInfo}
              onChange={handleChange}
              required
            />
          )}

          <div className="visibility-selector">
            <label htmlFor="visibility">Event Visibility</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              required
            >
              <option value="public">Public (Listed when searched)</option>
              <option value="private">Private (Only with link)</option>
            </select>
          </div>

          <button type="submit">Create Event</button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
