import React, { useEffect, useState } from 'react';
import { ref, get, set, update } from 'firebase/database';
import { realtimeDB, auth } from '../firebase';
import Navbar2 from '../Universe/Nav_bar';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

const generateTeamId = () => {
  // Generate a simple unique ID
  return 'TEAM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [teamFormVisible, setTeamFormVisible] = useState(false);
  const [joinFormVisible, setJoinFormVisible] = useState(false);
  const [teamCreated, setTeamCreated] = useState(false);
  const [teamData, setTeamData] = useState({
    teamName: '',
    tagline: '',
  });
  const [joinTeamId, setJoinTeamId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = ref(realtimeDB, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);

        if (data.teamId) {
          setTeamCreated(true);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const teamId = generateTeamId();

    const newTeam = {
      teamName: teamData.teamName,
      tagline: teamData.tagline,
      creatorId: currentUser.uid,
      members: [currentUser.uid],
    };

    await set(ref(realtimeDB, `teams/${teamId}`), newTeam);
    await update(ref(realtimeDB, `users/${currentUser.uid}`), { teamId });

    setTeamCreated(true);
    setTeamFormVisible(false);
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser || !joinTeamId) return;

    const teamRef = ref(realtimeDB, `teams/${joinTeamId}`);
    const snapshot = await get(teamRef);

    if (!snapshot.exists()) {
      alert("Team ID not found.");
      return;
    }

    const team = snapshot.val();
    const members = team.members || [];

    if (members.includes(currentUser.uid)) {
      alert("You are already in this team.");
      return;
    }

    if (members.length >= 4) {
      alert("This team already has 4 members.");
      return;
    }

    members.push(currentUser.uid);

    await update(teamRef, { members });
    await update(ref(realtimeDB, `users/${currentUser.uid}`), { teamId: joinTeamId });

    setTeamCreated(true);
    alert('Successfully joined the team!');
    setJoinFormVisible(false);
  };

  const handleChange = (e) => {
    setTeamData({ ...teamData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <Navbar2 />
      <div className="profile-container">
        <h2>Profile</h2>

        {userData ? (
          <div className="profile-card">
            <p><strong>Name:</strong> {userData.name || '—'}</p>
            <p><strong>Email:</strong> {userData.email || '—'}</p>
            <p><strong>Phone Number:</strong> {userData.phone || '—'}</p>
            {userData.teamId && (
              <p><strong>Team ID:</strong> {userData.teamId}</p>
            )}

            {/* Role-Specific Fields */}
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

            {/* Team Section */}
            {!teamCreated && (
              <>
                {!teamFormVisible ? (
                  <button className="create-team-button" onClick={() => setTeamFormVisible(true)}>
                    Create Team
                  </button>
                ) : (
                  <form className="team-form" onSubmit={handleCreateTeam}>
                    <h3>Create Team</h3>
                    <input
                      type="text"
                      name="teamName"
                      placeholder="Team Name"
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="tagline"
                      placeholder="Tagline"
                      onChange={handleChange}
                      required
                    />
                    <button type="submit">Submit Team</button>
                  </form>
                )}

                {!joinFormVisible ? (
                  <button className="join-team-button" onClick={() => setJoinFormVisible(true)}>
                    Join Team
                  </button>
                ) : (
                  <form className="join-form" onSubmit={handleJoinTeam}>
                    <h3>Join Team</h3>
                    <input
                      type="text"
                      placeholder="Enter Team ID"
                      value={joinTeamId}
                      onChange={(e) => setJoinTeamId(e.target.value)}
                      required
                    />
                    <button type="submit">Join</button>
                  </form>
                )}
              </>
            )}

            {teamCreated && (
              <button className="view-team-button" onClick={() => navigate('/team-profile')}>
                View Team Profile
              </button>
            )}
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
