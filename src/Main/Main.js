import React, { useEffect, useState } from 'react';
import { ref as dbRef, get, child } from 'firebase/database';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { auth, realtimeDB, storage } from '../firebase';
import NavBar from '../Universe/Nav_bar';
import './Main.css';

const Main = () => {
  const [createdEvents, setCreatedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const userId = auth.currentUser.uid;
        const dbRoot = dbRef(realtimeDB);

        // Fetch created events
        const createdSnapshot = await get(child(dbRoot, `users/${userId}/createdEvents`));
        let createdList = [];

        if (createdSnapshot.exists()) {
          const createdData = createdSnapshot.val();
          for (const id in createdData) {
            const eventSnap = await get(child(dbRoot, `events/${id}`));
            if (eventSnap.exists()) {
              const event = eventSnap.val();
              event.id = id;
              event.imageUrl = await getImageUrl(id);
              createdList.push(event);
            }
          }
        }

        // Fetch registered events
        const registeredSnapshot = await get(child(dbRoot, `users/${userId}/registeredEvents`));
        let registeredList = [];

        if (registeredSnapshot.exists()) {
          const registeredData = registeredSnapshot.val();
          for (const id in registeredData) {
            const eventSnap = await get(child(dbRoot, `events/${id}`));
            if (eventSnap.exists()) {
              const event = eventSnap.val();
              event.id = id;
              event.imageUrl = await getImageUrl(id);
              registeredList.push(event);
            }
          }
        }

        const sortByDate = (a, b) => new Date(a.eventDate) - new Date(b.eventDate);

        setCreatedEvents(createdList.sort(sortByDate));
        setRegisteredEvents(registeredList.sort(sortByDate));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    const getImageUrl = async (eventId) => {
      try {
        const imageRef = storageRef(storage, `eventImages/${eventId}.jpg`);
        return await getDownloadURL(imageRef);
      } catch {
        return '/placeholder.png'; // fallback image
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = (events) =>
    events
      .filter(event =>
        event.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(event => {
        const now = new Date();
        return showPast
          ? new Date(event.eventDate) < now
          : new Date(event.eventDate) >= now;
      });

  return (
    <div>
      <NavBar />
      <div className="main-container">
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />

        <div className="toggle-buttons">
          <button onClick={() => setShowPast(false)} className={!showPast ? 'active' : ''}>Upcoming</button>
          <button onClick={() => setShowPast(true)} className={showPast ? 'active' : ''}>Past</button>
        </div>

        {loading ? (
          <div className="loader">Loading events...</div>
        ) : (
          <>
            <h2 className="section-title">Your Events</h2>

            <div className="timeline">
              {filteredEvents([...createdEvents, ...registeredEvents]).map((event, index) => (
                <div key={event.id} className="event-card">
                  <div className="event-time">{new Date(event.eventDate).toLocaleString()}</div>
                  <div className="event-details">
                    <img src={event.imageUrl} alt={event.eventName} className="event-image" />
                    <div>
                      <h3>{event.eventName}</h3>
                      <p>{event.location || 'No location'}</p>
                      <span className="event-tag">{createdEvents.some(e => e.id === event.id) ? 'Created' : 'Registered'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Main;
