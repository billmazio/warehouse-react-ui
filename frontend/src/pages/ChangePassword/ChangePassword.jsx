import React, { useState } from "react";
import axios from "../../services/api"; // Adjust path if necessary
import "./ChangePassword.css"; // Optional: Add styles if needed

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("Οι νέοι κωδικοί δεν ταιριάζουν.");
            return;
        }

        try {
            await axios.post("/api/auth/change-password", {
                currentPassword,
                newPassword,
            });

            setMessage("Ο κωδικός άλλαξε επιτυχώς.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setMessage("Αποτυχία αλλαγής κωδικού: " + (error.response?.data || error.message));
        }
    };



    return (
        <div className="password-container">
            <h2>Αλλαγή Κωδικού</h2>
            <form onSubmit={handleChangePassword}>
                <div className="password-form-group">
                    <label>Τρέχων Κωδικός</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="password-form-group">
                    <label>Νέος Κωδικός</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="password-form-group">
                    <label>Επιβεβαίωση Νέου Κωδικού</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button className="button-password" type="submit">Αλλαγή Κωδικού</button>
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default ChangePassword;
