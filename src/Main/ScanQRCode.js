import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { realtimeDB } from '../firebase';
import { getAuth } from 'firebase/auth';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { jsPDF } from 'jspdf';

const ScanQRCode = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const auth = getAuth();
  const qrCodeRegionId = 'qr-code-region';

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

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(qrCodeRegionId, {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(
      async (decodedText) => {
        if (!scanData) {
          setScanData(decodedText);

          const scanTime = new Date().toISOString();
          const userId = decodedText.trim(); // UID is scanned QR content

          const attendee = attendees.find((user) => user.userId === userId);
          if (attendee) {
            const updatedData = {
              ...attendee,
              scanTime,
            };

            await set(ref(realtimeDB, `events/${eventId}/registrations/${userId}`), updatedData);
            alert(`Attendance marked for ${attendee.userName}`);
          } else {
            alert('Scanned UID not found in registrations');
          }
        }
      },
      (errorMessage) => {
        console.warn('QR Code Scan Error:', errorMessage);
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error('Failed to clear QR scanner', error);
      });
    };
  }, [attendees, scanData, eventId]);

  const handleDownloadAttendance = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    doc.text('Event Attendance Report', 10, yPosition);
    yPosition += 10;

    attendees.forEach((attendee) => {
      const line = `${attendee.userName} - ${attendee.scanTime || 'Not scanned'}`;
      doc.text(line, 10, yPosition);
      yPosition += 10;
    });

    doc.save('attendance.pdf');
  };

  return (
    <div>
      <h2>Scan QR Code for Attendance</h2>
      <div id={qrCodeRegionId} style={{ width: '100%' }} />
      <button onClick={handleDownloadAttendance} style={{ marginTop: '20px' }}>
        Download Attendance PDF
      </button>
    </div>
  );
};

export default ScanQRCode;
