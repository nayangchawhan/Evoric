import React, { useEffect, useState } from 'react';
import { ref as dbRef, get, child, update, remove } from 'firebase/database';
import { auth, realtimeDB } from '../firebase';
import Navbar2 from '../Universe/Nav_bar';
import { CiLocationOn } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import './Main.css';

const Discover = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [createdEventIds, setCreatedEventIds] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userId = user.uid;
        const dbRoot = dbRef(realtimeDB);

        const createdList = [];
        const regList = [];

        // 1. Get registered event IDs
        const regSnap = await get(child(dbRoot, 'eventRegistrations'));
        if (regSnap.exists()) {
          const registrations = regSnap.val();
          for (const eventId in registrations) {
            if (registrations[eventId]?.[userId]) {
              regList.push(eventId);
            }
          }
        }

        // 2. Get created event IDs
        const createdSnap = await get(child(dbRoot, `users/${userId}/createdEvents`));
        if (createdSnap.exists()) {
          const createdMap = createdSnap.val();
          for (const key in createdMap) {
            createdList.push(createdMap[key]);
          }
        }

        // 3. Get all events
        const eventsSnap = await get(child(dbRoot, 'events'));
        const all = eventsSnap.exists() ? eventsSnap.val() : {};

        // 4. Convert to array & sort by date
        const eventArray = Object.entries(all).map(([id, data]) => ({
          ...data,
          id,
        }));

        const sortedEvents = eventArray.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        setCreatedEventIds(createdList);
        setRegisteredEventIds(regList);
        setAllEvents(sortedEvents);
        setLoading(false);
      } catch (error) {
        console.error('🔥 Error fetching events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filterEvents = (events) =>
    events.filter(event =>
      event.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleDeleteCreatedEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user || !eventId) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (!confirmDelete) return;

    try {
      await remove(dbRef(realtimeDB, `events/${eventId}`));

      const userEventsSnap = await get(child(dbRef(realtimeDB), `users/${user.uid}/createdEvents`));
      if (userEventsSnap.exists()) {
        const createdEventMap = userEventsSnap.val();
        const updatedMap = Object.fromEntries(
          Object.entries(createdEventMap).filter(([_, value]) => value !== eventId)
        );
        await update(dbRef(realtimeDB, `users/${user.uid}`), { createdEvents: updatedMap });
      }

      setAllEvents(prev => prev.filter(ev => ev.id !== eventId));
      alert('Event deleted successfully!');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event.');
    }
  };

  const handleUnregister = async (eventId) => {
    const user = auth.currentUser;
    if (!user || !eventId) return;

    const confirmUnregister = window.confirm("Are you sure you want to unregister from this event?");
    if (!confirmUnregister) return;

    try {
      await remove(dbRef(realtimeDB, `eventRegistrations/${eventId}/${user.uid}`));
      setRegisteredEventIds(prev => prev.filter(id => id !== eventId));
      alert('Unregistered successfully!');
    } catch (err) {
      console.error('Error unregistering:', err);
      alert('Failed to unregister.');
    }
  };

  return (
    <div className='Main-div'>
      <Navbar2 />
      <div className="main-container">
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
          style={{ color: 'black' }}
        />

        {loading ? (
          <div className="loader" style={{ color: 'black' }}>
            Loading events...
            <p>Please login again if it takes long time</p>
          </div>
        ) : (
          <>
            <h2 className="section-title" style={{ marginBottom: '10px' }}>All Events</h2>
            <div className="timeline">
              {filterEvents(allEvents).map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-time">{new Date(event.startDate).toLocaleString()}+</div>
                  <div className="event-details">
                    <div>
                      <h3
                        style={{ cursor: 'pointer', fontFamily: 'Just another hand', letterSpacing: '2px', fontSize: '2rem' }}
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        {event.name || 'Untitled'}
                      </h3>
                      <h6>{event.tagline || 'Untitled'}</h6>
                      <p><a style={{ color: 'white' }} href={event.address || 'No location'}><CiLocationOn style={{ color: 'white' }} />Location</a></p>

                      {createdEventIds.includes(event.id) && (
                        <span className="event-tag">Created</span>
                      )}
                      {registeredEventIds.includes(event.id) && !createdEventIds.includes(event.id) && (
                        <span className="event-tag" style={{ backgroundColor: '#4caf50' }}>Registered</span>
                      )}

                      {createdEventIds.includes(event.id) && (
                        <button className="delete-btn" onClick={() => handleDeleteCreatedEvent(event.id)} style={{ marginLeft: '5px' }}>
                          Delete
                        </button>
                      )}

                      {!createdEventIds.includes(event.id) && registeredEventIds.includes(event.id) && (
                        <button className="delete-btn" onClick={() => handleUnregister(event.id)} style={{ marginLeft: '5px' }}>
                          Unregister
                        </button>
                      )}
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

export default Discover;
