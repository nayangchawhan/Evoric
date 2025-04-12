import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { realtimeDB } from '../firebase';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { QrReader } from 'react-qr-reader';

const ScanQRCode = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [scanData, setScanData] = useState(null); // Store scan details
  const [attendees, setAttendees] = useState([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      const snapshot = await get(ref(realtimeDB, `events/${eventId}`));
      if (snapshot.exists()) {
        setEventData(snapshot.val());
      }
    };
    fetchEvent();

    const fetchAttendees = async () => {
      const snapshot = await get(ref(realtimeDB, `events/${eventId}/registrations`));
      if (snapshot.exists()) {
        setAttendees(Object.values(snapshot.val()));
      }
    };
    fetchAttendees();
  }, [eventId]);

  const handleScan = (data) => {
    if (data) {
      setScanData(data); // Set scan data
      const scanTime = new Date().toISOString();

      // Update attendance with scan time
      const userId = data; // Assuming the QR code contains the user's UID
      const updatedData = {
        ...attendees.find(user => user.userId === userId),
        scanTime: scanTime,
      };

      set(ref(realtimeDB, `events/${eventId}/registrations/${userId}`), updatedData);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const handleDownloadAttendance = () => {
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();
    let yPosition = 20;

    doc.text("Event Attendance Report", 10, yPosition);
    yPosition += 10;

    attendees.forEach(attendee => {
      const line = `${attendee.userName} - ${attendee.scanTime || 'Not scanned'}`;
      doc.text(line, 10, yPosition);
      yPosition += 10;
    });

    doc.save('attendance.pdf');
  };

  return (
    <div>
      <h2>Scan QR Code for Attendance</h2>
      <QrReader
        delay={300}
        style={{ width: '100%' }}
        onScan={handleScan}
        onError={handleError}
      />
      <button onClick={handleDownloadAttendance}>Download Attendance PDF</button>
    </div>
  );
};

export default ScanQRCode;
