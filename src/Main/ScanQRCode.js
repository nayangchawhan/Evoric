import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { realtimeDB } from '../firebase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './ScanQRCode.css'; // Add styles here

const ScanQRCode = () => {
  const { eventId } = useParams();
  const [attendees, setAttendees] = useState([]);
  const scannedUIDs = useRef(new Set());
  const qrCodeRegionId = 'qr-code-region';

  useEffect(() => {
    const fetchAttendees = async () => {
      const snapshot = await get(ref(realtimeDB, `eventRegistrations/${eventId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const attendeeList = Object.entries(data).map(([uid, details]) => ({
          userId: uid,
          ...details,
        }));
        setAttendees(attendeeList);
      }
    };

    fetchAttendees();
  }, [eventId]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(qrCodeRegionId, {
      fps: 30,
      qrbox: { width: 200, height: 200 },
      rememberLastUsedCamera: true,
      aspectRatio: 1.0,
    });

    scanner.render(
      async (decodedText) => {
        try {
          const parsed = JSON.parse(decodedText);
          const userId = parsed.uid?.trim();
          const scannedEventId = parsed.eventId;

          if (!userId || scannedEventId !== eventId) {
            alert('Invalid QR Code');
            return;
          }

          if (scannedUIDs.current.has(userId)) return;
          scannedUIDs.current.add(userId);
          setTimeout(() => scannedUIDs.current.delete(userId), 5000);

          const scanTime = new Date().toISOString();
          const attendee = attendees.find((user) => user.userId === userId);

          if (attendee) {
            await set(ref(realtimeDB, `eventAttendance/${eventId}/${userId}`), {
              uid: userId,
              name: attendee.name || '',
              email: attendee.email || '',
              time: scanTime,
            });

            alert(`✅ Attendance marked for ${attendee.name || userId}`);
          } else {
            alert('❌ UID not found in registrations');
          }
        } catch (error) {
          console.error("QR code scan error:", error);
        }
      },
      (error) => {
        console.warn("QR scanning error:", error);
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error('Failed to clear scanner:', error);
      });
    };
  }, [attendees, eventId]);

  return (
    <div className="scanner-wrapper">
      <div className="scanner-card">
        <h2>📷 Scan QR Ticket</h2>
        <div id={qrCodeRegionId} style={{ width: '100%' }} />
        <p className="note">Please scan one ticket at a time.</p>
      </div>
    </div>
  );
};

export default ScanQRCode;
