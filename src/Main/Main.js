import React, { useEffect, useState } from 'react';
import { ref as dbRef, get, child } from 'firebase/database';
import { auth, realtimeDB } from '../firebase';
import Navbar2 from '../Universe/Nav_bar';
import { CiLocationOn } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import './Main.css';

const Main = () => {
  const [createdEvents, setCreatedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
          try {
            const user = auth.currentUser;
            if (!user) return;
      
            const userId = user.uid;
            const dbRoot = dbRef(realtimeDB);
      
            const createdList = [];
            const registeredEventIds = [];
      
            // 1. Fetch eventRegistrations
            const regSnap = await get(child(dbRoot, 'eventRegistrations'));
            if (regSnap.exists()) {
              const registrations = regSnap.val();
              for (const eventId in registrations) {
                const userList = registrations[eventId];
                if (userList && userList[userId]) {
                  registeredEventIds.push(eventId);
                }
              }
            }
      
            // 2. Fetch all events
            const eventsSnap = await get(child(dbRoot, 'events'));
            const allEvents = eventsSnap.exists() ? eventsSnap.val() : {};
      
            const registeredList = [];
            for (const eventId in allEvents) {
              const event = allEvents[eventId];
              event.id = eventId;
      
              if (registeredEventIds.includes(eventId)) {
                registeredList.push(event);
              }
            }
      
            // 3. Fetch createdEvents from users/{userId}/createdEvents
            const createdEventsSnap = await get(child(dbRoot, `users/${userId}/createdEvents`));
            if (createdEventsSnap.exists()) {
              const createdEventMap = createdEventsSnap.val();
              for (const key in createdEventMap) {
                const eventId = createdEventMap[key];
                if (allEvents[eventId]) {
                  createdList.push({
                    ...allEvents[eventId],
                    id: eventId
                  });
                }
              }
            }
      
            setCreatedEvents(createdList);
            setRegisteredEvents(registeredList);
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
        />

        {loading ? (
          <div className="loader" style={{color:'black'}}>Loading events...
          <p>Please login again if it takes long time</p>
          </div>
        ) : (
          <>
            <h2 className="section-title">Events Created by You</h2>
            <div className="timeline">
              {filterEvents(createdEvents).map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-time">{new Date(event.startDate).toLocaleString()}</div>
                  <div className="event-details">
                    <div>
                      <h3 style={{cursor:'pointer',fontFamily:'Just another hand', letterSpacing:'2px', fontSize:'2rem'}} onClick={() => navigate(`/event/${event.id}`)}>{event.name || 'Untitled'}</h3>
                      <h6>{event.tagline || 'Untitled'}</h6>
                      <p><a style={{color:'white'}}href={event.address || 'No location'}><CiLocationOn style={{color:'white'}}/>Location</a></p>
                      <span className="event-tag">Created</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="section-title">Events Registered by You</h2>
            <div className="timeline">
              {filterEvents(registeredEvents).map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-time">{new Date(event.startDate).toLocaleString()}</div>
                  <div className="event-details">
                    <div>
                      <h3 style={{fontFamily:'Just another hand', letterSpacing:'2px', fontSize:'2rem'}} onClick={() => navigate(`/event/${event.id}`)}>{event.name || 'Untitled'}</h3>
                      <h6>{event.tagline || 'Untitled'}</h6>
                      <p style={{fontSize:'small'}}>{event.description}</p>
                      <p><a style={{color:'white'}}href={event.address || 'No location'}><CiLocationOn style={{color:'white'}}/>Location</a></p>
                      <span className="event-tag">Registered</span>
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
