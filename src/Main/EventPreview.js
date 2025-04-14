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
import { jsPDF } from 'jspdf';
import './EventPreview.css';

const EventPreview = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [userQRData, setUserQRData] = useState('');
  const [availableSeats, setAvailableSeats] = useState(null);
  const [teamId, setTeamId] = useState('');
    const [customAnswers, setCustomAnswers] = useState({});
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);

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
  
    if (availableSeats <= 0) return alert("Sorry, no more seats available!");
  
    const now = new Date();
  
    if (eventData.registrationDeadlineDate && eventData.registrationDeadlineTime) {
      const regDeadline = new Date(`${eventData.registrationDeadlineDate}T${eventData.registrationDeadlineTime}`);
      if (now >= regDeadline) return alert("Registration has closed. The deadline has passed.");
    }
  
    if (eventData.startDate && eventData.startTime) {
      const eventStart = new Date(`${eventData.startDate}T${eventData.startTime}`);
      if (now >= eventStart) return alert("Registration has closed. The event has already started.");
    }
  
    const userProfileSnapshot = await get(ref(realtimeDB, `users/${user.uid}`));
    if (!userProfileSnapshot.exists()) return alert("Please complete your profile before registering.");
  
    const profile = userProfileSnapshot.val();
    const requiredFields = ['name', 'phone'];
    const isProfileComplete = requiredFields.every(field => profile[field]);
    if (!isProfileComplete) return alert("Please complete your profile (name and phone) before registering.");
  
    // Team check if required
    let teamMembers = [user.uid];
    if (eventData.requiresTeamId) {
      if (!teamId.trim()) return alert("Please enter a valid Team ID.");
      
      const teamSnapshot = await get(ref(realtimeDB, `teams/${teamId}`));
      if (!teamSnapshot.exists()) return alert("Team ID does not exist.");
  
      const teamData = teamSnapshot.val();
      teamMembers = teamData.members || [];
  
      if (!teamMembers.includes(user.uid)) {
        return alert("You must be a member of this team to register.");
      }
    }
  
    // Register all team members
    for (const memberUid of teamMembers) {
      const memberProfileSnap = await get(ref(realtimeDB, `users/${memberUid}`));
      const memberProfile = memberProfileSnap.exists() ? memberProfileSnap.val() : {};
  
      await update(ref(realtimeDB, `eventRegistrations/${eventId}/${memberUid}`), {
        uid: memberUid,
        email: memberProfile.email || '',
        registeredAt: new Date().toISOString(),
        teamId: eventData.requiresTeamId ? teamId.trim() : null,
        customAnswers: {} // You can enhance this if you want per-user answers
      });
  
      // Special case: if current user, set local QR and flag
      if (memberUid === user.uid) {
        setRegistered(true);
        setUserQRData(JSON.stringify({ eventId, uid: user.uid }));
      }
    }
  
    alert("Successfully registered all team members!");
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

  const handleDownloadAttendancePDF = async () => {
    const snapshot = await get(ref(realtimeDB, `eventAttendance/${eventId}`));
    if (!snapshot.exists()) return alert("No attendance data found!");
  
    const data = snapshot.val();
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("Event Attendance List", 20, 20);
    doc.setFontSize(12);
  
    let y = 30;
    doc.text("Name", 20, y);
    doc.text("Email", 100, y);
    doc.text("Scan Time", 240, y);
    y += 10;
  
    Object.values(data).forEach((entry) => {
      doc.text(entry.name || 'N/A', 20, y);
      doc.text(entry.email || 'N/A', 100, y);
      doc.text(entry.time || 'N/A', 240, y);
      y += 10;
  
      if (y > 190) {
        doc.addPage();
        y = 20;
      }
    });
  
    doc.save(`Attendance_${eventId}.pdf`);
  };
  

  const handleDownloadPDF = async () => {
    const snapshot = await get(ref(realtimeDB, `eventRegistrations/${eventId}`));
    if (!snapshot.exists()) return alert("No registration data found!");
  
    const data = snapshot.val();
  
    // Fetch additional user profile information
    const usersSnapshot = await get(ref(realtimeDB, `users`));
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
  
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("Registered Members", 20, 20);
    doc.setFontSize(12);
    let y = 30;
  
    // Add the headers to the PDF
    doc.text("Name", 20, y);
    doc.text("Email", 80, y);
    doc.text("Phone", 140, y);
    if (eventData.category === "college") {
      doc.text("USN", 200, y);
      doc.text("Section", 260, y);
      doc.text("Semester", 320, y);
      doc.text("Department", 380, y);
    }
    y += 10;
  
    // Loop through the registrations and add them to the PDF
    Object.entries(data).forEach(([uid, info]) => {
      const profile = users[uid]; // Get the user profile
  
      // Check if the user profile exists
      if (profile) {
        doc.text(profile.name || 'N/A', 20, y);
        doc.text(info.email || 'N/A', 80, y);
        doc.text(profile.phone || 'N/A', 140, y);
  
        if (eventData.category === "College Event") {
          doc.text(profile.usn || 'N/A', 200, y);
          doc.text(profile.section || 'N/A', 260, y);
          doc.text(profile.semester || 'N/A', 320, y);
          doc.text(profile.department || 'N/A', 380, y);
        }
  
        y += 10;
        if (y > 280) { // Add new page if overflow
          doc.addPage();
          y = 20;
        }
      }
    });
  
    doc.save(`Registrations_${eventId}.pdf`);
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
        <div className='event-grid'>
            <div className='event-preview-left'>
                <strong>Start date</strong>
                <p>{eventData.startDate}</p>
                <strong>End Date</strong>
                <p>{eventData.endDate}</p>
                <strong>Start Time</strong>
                <p>{eventData.startTime}</p>
                <strong>End Time</strong>
                <p> {eventData.endTime}</p>

                <strong>Registration Deadline</strong>
                <p> {eventData.registrationDeadlineDate}</p>
                <p> {eventData.registrationDeadlineTime}</p>

                <strong>Available Seats</strong> 
                <p>{availableSeats !== null ? availableSeats : "Loading..."}</p>
                <strong>Venue</strong> 
                <p>{eventData.venue}</p>

                {showRegistrationForm && (
                    <div className="custom-registration-form">
                        {eventData.requiresTeamId && (
                        <>
                            <label>Enter Team ID:</label>
                            <input
                            type="text"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            />
                        </>
                        )}

                        {eventData.additionalQuestions && eventData.additionalQuestions.length > 0 &&
                        eventData.additionalQuestions.map((q, idx) => (
                            <div key={idx}>
                            <label>{q}</label>
                            <input
                                type="text"
                                value={customAnswers[q] || ''}
                                onChange={(e) =>
                                setCustomAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                                }
                            />
                            </div>
                        ))
                        }
                        </div>
                    )}
            </div>
            <div className='event-preview-right'>
                <strong>Location</strong> 
                <p><a href={eventData.address} target="_blank" rel="noreferrer"><CiLocationOn /> View on Google Maps</a></p>
                <strong>About Event</strong>
                <p style={{whiteSpace: 'pre-wrap'}}> {eventData.description}</p>
                <strong>Category</strong> 
                <p>{eventData.category}</p>
                <strong>Office/College/Public Event Name</strong>
                <p> {eventData.additionalInfo}</p>
                <strong>Visibility</strong>
                <p> {eventData.visibility}</p>
            </div>
        </div>
        {isOwner ? (
          <>
            <button style={{marginBottom:'5px'}} onClick={handleScanQR}><RiQrScanLine /> Scan QR</button>
            <button style={{marginBottom:'5px'}} onClick={handleDownloadAttendancePDF}><IoCloudDownloadOutline /> Attendance</button>
            <button style={{marginBottom:'5px'}} onClick={handleDownloadPDF}><IoCloudDownloadOutline /> Registration PDF</button>
          </>
        ) : (
            !registered ? (
                availableSeats > 0 ? (
                  <div>
                    {eventData.requiresTeamId && (
                      <div className="team-id-input">
                        <label>Enter Team ID:</label>
                        <input
                          type="text"
                          value={teamId}
                          onChange={(e) => setTeamId(e.target.value)}
                          placeholder="Team ID"
                        />
                      </div>
                    )}
                    <button onClick={handleRegister}>🎟️ Register to Join</button>
                  </div>
                ) : (
                  <p style={{ color: 'red', fontWeight: 'bold' }}>Registration Closed</p>
                )
              ) : (
                <div>
                  <p>You are already registered! Here's your ticket:</p>
                  <QRCodeCanvas id="qrCanvas" value={userQRData} size={200} />
                  <br />
                  <button onClick={handleDownloadQR}><IoCloudDownloadOutline /> QR Ticket</button>
                </div>
              
              
        ))}

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
