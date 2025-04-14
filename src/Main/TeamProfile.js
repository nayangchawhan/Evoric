import React, { useEffect, useState } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { realtimeDB, auth } from '../firebase';
import Navbar2 from '../Universe/Nav_bar';
import { useNavigate } from 'react-router-dom';
import './TeamProfile.css';

const TeamProfile = () => {
  const [teamData, setTeamData] = useState(null);
  const [teamEvents, setTeamEvents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamInfo = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userRef = ref(realtimeDB, `users/${user.uid}`);
        const userSnap = await get(userRef);

        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = userSnap.val();
        const teamId = userData.teamId;
        if (!teamId) {
          setLoading(false);
          return;
        }

        const teamRef = ref(realtimeDB, `teams/${teamId}`);
        const teamSnap = await get(teamRef);

        if (!teamSnap.exists()) {
          setLoading(false);
          return;
        }

        const team = teamSnap.val();
        setTeamData({ ...team, id: teamId });

        if (team.creatorId === user.uid) {
          setIsAdmin(true);
        }

        const memberIds = team.members || [];
        const memberPromises = memberIds.map(async (uid) => {
          const memberRef = ref(realtimeDB, `users/${uid}`);
          const memberSnap = await get(memberRef);
          return memberSnap.exists() ? { uid, ...memberSnap.val() } : null;
        });

        const members = await Promise.all(memberPromises);
        setTeamMembers(members.filter(Boolean));

        const eventsRef = ref(realtimeDB, `teams/${teamId}/registeredEvents`);
        const eventsSnap = await get(eventsRef);

        if (eventsSnap.exists()) {
          const events = eventsSnap.val();
          const eventList = Object.keys(events).map((eventId) => {
            const event = events[eventId];
            return {
              id: eventId,
              eventName: event.name || 'Untitled Event',
              registeredAt: event.registeredAt || Date.now(),
            };
          });
          setTeamEvents(eventList);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setLoading(false);
      }
    };

    fetchTeamInfo();
  }, [navigate]);

  const handleDeleteTeam = async () => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      await remove(ref(realtimeDB, `teams/${teamData.id}`));
      navigate('/dashboard');
    }
  };

  const handleRemoveMember = async (memberUid) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      const updatedMembers = teamMembers.filter((member) => member.uid !== memberUid);
      await update(ref(realtimeDB, `teams/${teamData.id}`), {
        members: updatedMembers.map((m) => m.uid),
      });
      setTeamMembers(updatedMembers);
    }
  };

  const handleLeaveTeam = async () => {
    if (window.confirm('Are you sure you want to leave this team?')) {
      try {
        const user = auth.currentUser;
        if (!user) return;
  
        // 1. Remove current user from team's member list
        const updatedMembers = teamMembers.filter((member) => member.uid !== user.uid);
        const teamRef = ref(realtimeDB, `teams/${teamData.id}`);
        await update(teamRef, {
          members: updatedMembers.map((member) => member.uid),
        });
  
        // 2. Remove teamId from the user's profile
        const userRef = ref(realtimeDB, `users/${user.uid}`);
        await update(userRef, { teamId: null });
  
        // 3. Update local state
        setTeamMembers(updatedMembers);
        setTeamData(null); // Triggers "No Team Found" UI
      } catch (error) {
        console.error('Error leaving team:', error);
      }
    }
  };
  

  if (loading) return <p>Loading team profile...</p>;

  if (!teamData) {
    return (
      <div>
        <Navbar2 />
        <div className="team-profile-container">
          <h2>No Team Found</h2>
          <p>You are not part of any team yet.</p>
          <button onClick={() => navigate('/create-team')}>Create a Team</button>
          <button onClick={() => navigate('/join-team')}>Join a Team</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar2 />
      <div className="team-profile-container">
        <h2>Team Profile</h2>

        <div className="team-details">
          <p><strong>Team Name:</strong> {teamData.teamName}</p>
          <p><strong>Tagline:</strong> {teamData.tagline}</p>
          <p><strong>Team ID:</strong> {teamData.id}</p>
          <p><strong>Projects:</strong> {teamData.project || '—'}</p>
          <p><strong>Achievements:</strong> {teamData.achievements || '—'}</p>
        </div>

        <div className="team-members">
          <h3>Team Members</h3>
          {teamMembers.length > 0 ? (
            <ul>
              {teamMembers.map((member) => (
                <li key={member.uid}>
                  {member.name} ({member.email})
                  {isAdmin && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveMember(member.uid)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No members found.</p>
          )}
        </div>

        <div className="registered-events">
          <h3>Registered Events</h3>
          {teamEvents.length > 0 ? (
            <ul>
              {teamEvents.map((event) => (
                <li key={event.id}>
                  {event.eventName} (Registered at:{' '}
                  {new Date(event.registeredAt).toLocaleString()})
                </li>
              ))}
            </ul>
          ) : (
            <p>No events registered.</p>
          )}
        </div>

        {isAdmin && (
          <div className="team-actions">
            <button onClick={() => navigate('/edit-team')}>Edit Team</button>
            <button onClick={handleDeleteTeam}>Delete Team</button>
          </div>
        )}

        {!isAdmin && (
        <div className="team-actions">
            <button onClick={handleLeaveTeam}>Leave Team</button>
        </div>
        )}

      </div>
    </div>
  );
};

export default TeamProfile;
