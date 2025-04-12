import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { realtimeDB, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeCanvas } from 'qrcode.react';
import Navbar2 from '../Universe/Nav_bar';
import './EventPreview.css';

const EventPreview = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [userQRData, setUserQRData] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      const snapshot = await get(ref(realtimeDB, `events/${eventId}`));
      if (snapshot.exists()) setEventData(snapshot.val());
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        checkIfRegistered(user.uid);
      }
    },[checkIfRegistered]);

    fetchEvent();
    return () => unsubscribe();
  }, [eventId]);

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
    // Route to scanner page or display scanner directly
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
    <div>
      <Navbar2 />
      <div className="event-preview">
        <h2>{eventData.name}</h2>
        <p><strong>Type:</strong> {eventData.type}</p>
        <p><strong>Start Date:</strong> {eventData.startDate}</p>
        <p><strong>End Date:</strong> {eventData.endDate}</p>
        <p><strong>Max Seats:</strong> {eventData.maxSeats}</p>
        <p><strong>Address:</strong> <a href={eventData.address} target="_blank" rel="noreferrer">View on Google Maps</a></p>
        <p><strong>Venue:</strong> {eventData.venue}</p>
        <p><strong>Description:</strong> {eventData.description}</p>
        <p><strong>Category:</strong> {eventData.category}</p>
        <p><strong>Additional Info:</strong> {eventData.additionalInfo}</p>
        <p><strong>Visibility:</strong> {eventData.visibility}</p>

        {isOwner ? (
          <>
            <button onClick={handleScanQR}>📷 Scan QR for Attendance</button>
            <button onClick={handleDownloadAttendance}>📥 Download Attendance</button>
          </>
        ) : (
          !registered ? (
            <button onClick={handleRegister}>🎟️ Register for Event</button>
          ) : (
            <div>
              <p>You are already registered! Here's your ticket:</p>
              <QRCodeCanvas id="qrCanvas" value={userQRData} size={200} />
              <br />
              <button onClick={handleDownloadQR}>⬇️ Download QR Ticket</button>
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
