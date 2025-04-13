import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { realtimeDB, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeCanvas } from 'qrcode.react';
import Navbar2 from '../Universe/Nav_bar';
import { RiQrScanLine } from "react-icons/ri";
import { IoCloudDownloadOutline } from "react-icons/io5";
import { CiLocationOn } from "react-icons/ci";
import './EventPreview.css';

const EventPreview = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [userQRData, setUserQRData] = useState('');
  const [availableSeats, setAvailableSeats] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const snapshot = await get(ref(realtimeDB, `events/${eventId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setEventData(data);
        calculateAvailableSeats(data.maxSeats);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        checkIfRegistered(user.uid);
      }
    });

    fetchEvent();
    return () => unsubscribe();
  }, [eventId]);

  const calculateAvailableSeats = async (maxSeats) => {
    const snapshot = await get(ref(realtimeDB, `eventRegistrations/${eventId}`));
    const registrations = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    setAvailableSeats(maxSeats - registrations);
  };

  const checkIfRegistered = async (uid) => {
    const snapshot = await get(ref(realtimeDB, `eventRegistrations/${eventId}/${uid}`));
    setRegistered(snapshot.exists());
    if (snapshot.exists()) {
      setUserQRData(JSON.stringify({ eventId, uid }));
    }
  };

  const handleRegister = async () => {
    const user = auth.currentUser;
    if (!user) return alert("You need to be logged in to register.");

    const registrationRef = ref(realtimeDB, `eventRegistrations/${eventId}/${user.uid}`);
    await update(registrationRef, {
      uid: user.uid,
      email: user.email,
      registeredAt: new Date().toISOString()
    });

    setRegistered(true);
    setUserQRData(JSON.stringify({ eventId, uid: user.uid }));
    alert("Successfully registered!");
    calculateAvailableSeats(eventData.maxSeats);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qrCanvas");
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "ticket-qr.png";
    link.click();
  };

  const handleScanQR = () => {
    window.location.href = `/scan-attendance/${eventId}`;
  };

  const handleDownloadAttendance = async () => {
    const snapshot = await get(ref(realtimeDB, `eventAttendance/${eventId}`));
    if (!snapshot.exists()) return alert("No attendance data yet!");

    const data = snapshot.val();
    const rows = [['UID', 'Email', 'Scan Time']];

    for (const [uid, entry] of Object.entries(data)) {
      rows.push([uid, entry.email, entry.time]);
    }

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_${eventId}.csv`;
    link.click();
  };

  if (!eventData)
    return <p style={{ textAlign: 'center', marginTop: '100px', color: '#fff' }}>Loading event details...</p>;

  const isOwner = currentUser && eventData.createdBy === currentUser.uid;

  return (
    <div className={`event-preview-container ${eventData.theme}`}>
      <Navbar2 />
      <div className="event-preview">
        <h2 style={{ fontFamily: "Just Another Hand", fontSize: "40px", letterSpacing: "2px" }}>{eventData.name}</h2>
        <h4 style={{ textAlign: 'center' }}>{eventData.tagline}</h4>
        <p>{eventData.type}</p>

        <p><strong>Start Date:</strong> {eventData.startDate}</p>
        <p><strong>End Date:</strong> {eventData.endDate}</p>

        <p><strong>Start Time:</strong> {eventData.startTime}</p>
        <p><strong>End Time:</strong> {eventData.endTime}</p>

        <p><strong>Available Seats:</strong> {availableSeats !== null ? availableSeats : "Loading..."}</p>

        <p><strong>Address:</strong> <a href={eventData.address} target="_blank" rel="noreferrer"><CiLocationOn /> View on Google Maps</a></p>
        <p><strong>Venue:</strong> {eventData.venue}</p>
        <p><strong>About Event:</strong> {eventData.description}</p>
        <p><strong>Category:</strong> {eventData.category}</p>
        <p><strong>Office/College Name:</strong> {eventData.additionalInfo}</p>
        <p><strong>Visibility:</strong> {eventData.visibility}</p>

        {isOwner ? (
          <>
            <button onClick={handleScanQR}><RiQrScanLine /> Scan QR</button>
            <button onClick={handleDownloadAttendance}><IoCloudDownloadOutline /> Attendance</button>
          </>
        ) : (
          !registered ? (
            <button onClick={handleRegister}>🎟️ Register to Join</button>
          ) : (
            <div>
              <p>You are already registered! Here's your ticket:</p>
              <QRCodeCanvas id="qrCanvas" value={userQRData} size={200} />
              <br />
              <button onClick={handleDownloadQR}><IoCloudDownloadOutline /> QR Ticket</button>
            </div>
          )
        )}

        {eventData.visibility === 'private' && isOwner && (
          <div className="share-link">
            <p><strong>Private Event</strong></p>
            <p>Share this link:</p>
            <p>{`${window.location.origin}/event/${eventId}`}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPreview;
