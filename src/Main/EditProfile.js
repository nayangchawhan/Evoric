import React, { useEffect, useState } from 'react';
import { ref, get, update } from 'firebase/database';
import { realtimeDB, auth } from '../firebase';
import Navbar2 from '../Universe/Nav_bar';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css'; // optional styling

const EditProfile = () => {
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = ref(realtimeDB, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setFormData(snapshot.val());
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const userRef = ref(realtimeDB, `users/${user.uid}`);
    await update(userRef, formData);
    alert('Profile updated successfully!');
    navigate('/profile');
  };

  return (
    <div>
      <Navbar2 />
      <div className="edit-profile-container">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit} className="edit-form">
          <label>Name:</label>
          <input type="text" name="name" value={formData.name || ''} onChange={handleChange} />

          <label>Email:</label>
          <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />

          <label>Phone Number:</label>
          <input type="phonenumber" name="phone" value={formData.phone || ''} onChange={handleChange} />

          <label>Role:</label>
          <select name="role" value={formData.role || ''} onChange={handleChange}>
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="office">Office</option>
            <option value="public">Public</option>
          </select>

          {/* Dynamically Show Additional Fields Based on Role */}
          {formData.role === 'student' && (
            <>
              <label>College:</label>
              <input type="text" name="college" value={formData.college || ''} onChange={handleChange} />

              <label>USN:</label>
              <input type="text" name="usn" value={formData.usn || ''} onChange={handleChange} />

              <label>Semester:</label>
              <input type="text" name="semester" value={formData.semester || ''} onChange={handleChange} />

              <label>Year:</label>
              <input type="text" name="year" value={formData.year || ''} onChange={handleChange} />

              <label>Department:</label>
              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} />
            </>
          )}

          {formData.role === 'faculty' && (
            <>
              <label>College:</label>
              <input type="text" name="college" value={formData.college || ''} onChange={handleChange} />

              <label>Department:</label>
              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} />

              <label>Employee ID:</label>
              <input type="text" name="empId" value={formData.empId || ''} onChange={handleChange} />
            </>
          )}

          {formData.role === 'office' && (
            <>
              <label>Office:</label>
              <input type="text" name="office" value={formData.office || ''} onChange={handleChange} />

              <label>Department:</label>
              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} />

              <label>Employee ID:</label>
              <input type="text" name="empId" value={formData.empId || ''} onChange={handleChange} />
            </>
          )}

          <button type="submit" className="save-button">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
