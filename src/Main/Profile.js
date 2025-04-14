import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { realtimeDB, auth } from '../firebase';
import Navbar2 from '../Universe/Nav_bar';
import './Profile.css'; // optional for styling
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = ref(realtimeDB, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    };

    fetchUserData();
  }, []);

  return (
    <div>
      <Navbar2 />
      <div className="profile-container">
        <h2>User Profile</h2>

        {userData ? (
          <div className="profile-card">
            <p><strong>Name:</strong> {userData.name || '—'}</p>
            <p><strong>Email:</strong> {userData.email || '—'}</p>
            <p><strong>Phone Number:</strong> {userData.phone || '—'}</p>

            {userData.role === 'student' && (
              <>
                <p><strong>College:</strong> {userData.college || '—'}</p>
                <p><strong>USN:</strong> {userData.usn || '—'}</p>
                <p><strong>Semester:</strong> {userData.semester || '—'}</p>
                <p><strong>Year:</strong> {userData.year || '—'}</p>
                <p><strong>Department:</strong> {userData.department || '—'}</p>
              </>
            )}

            {userData.role === 'faculty' && (
              <>
                <p><strong>College:</strong> {userData.college || '—'}</p>
                <p><strong>Employee ID:</strong> {userData.empId || '—'}</p>
                <p><strong>Department:</strong> {userData.department || '—'}</p>
              </>
            )}

            {userData.role === 'office' && (
              <>
                <p><strong>Office:</strong> {userData.office || '—'}</p>
                <p><strong>Department:</strong> {userData.department || '—'}</p>
                <p><strong>Employee ID:</strong> {userData.empId || '—'}</p>
              </>
            )}

            <button className="edit-button" onClick={() => navigate('/edit-profile')}>
              Edit Profile
            </button>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
