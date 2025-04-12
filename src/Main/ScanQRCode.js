import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { realtimeDB } from '../firebase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { jsPDF } from 'jspdf';

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
      } else {
        console.warn("No registrations found for event:", eventId);
      }
    };

    fetchAttendees();
  }, [eventId]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(qrCodeRegionId, {
      fps: 30, // high fps for quicker detection
      qrbox: { width: 200, height: 200 }, // smaller box speeds detection
      rememberLastUsedCamera: true,
      aspectRatio: 1.0,
    });

    scanner.render(
      async (decodedText) => {
        try {
          console.log("Scanned:", decodedText);
          const parsed = JSON.parse(decodedText);
          const userId = parsed.uid?.trim();
          const scannedEventId = parsed.eventId;

          if (!userId || scannedEventId !== eventId) {
            alert('Invalid QR Code');
            return;
          }

          // Prevent rapid duplicate scans
          if (scannedUIDs.current.has(userId)) return;
          scannedUIDs.current.add(userId);
          setTimeout(() => scannedUIDs.current.delete(userId), 5000); // reset after 5 sec

          const scanTime = new Date().toISOString();
          const attendee = attendees.find((user) => user.userId === userId);

          if (attendee) {
            const updatedData = {
              ...attendee,
              scanTime,
            };
            await set(ref(realtimeDB, `eventRegistrations/${eventId}/${userId}`), updatedData);
            alert(`✅ Attendance marked for ${attendee.userName || userId}`);
          } else {
            alert('❌ UID not found in registrations');
          }
        } catch (error) {
          console.error("Failed to parse scanned QR code:", error);
        }
      },
      (error) => {
        console.warn("QR Scan Error:", error);
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error('Failed to clear QR scanner', error);
      });
    };
  }, [attendees, eventId]);

  const handleDownloadAttendance = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    doc.text('Event Attendance Report', 10, yPosition);
    yPosition += 10;

    attendees.forEach((attendee) => {
      const line = `${attendee.userName || attendee.userId} - ${attendee.scanTime || 'Not scanned'}`;
      doc.text(line, 10, yPosition);
      yPosition += 10;
    });

    doc.save('attendance.pdf');
  };

  return (
    <div>
      <h2>📷 Scan QR Code for Attendance</h2>
      <div id={qrCodeRegionId} style={{ width: '100%' }} />
      <button onClick={handleDownloadAttendance} style={{ marginTop: '20px' }}>
        📄 Download Attendance PDF
      </button>
    </div>
  );
};

export default ScanQRCode;
