import React, { useState } from "react";
import axios from "../../services/api";
import "./ChangePassword.css";

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            setMessage((error.response?.data || error.message));
        }
    };

    const handleCancel = (e) => {
        e.preventDefault(); // Prevent default form behavior
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage(""); // Clear any error or success message
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
                    <div className="password-input-wrapper">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? "👁️" : "👁️‍🗨️"}
                        </span>
                    </div>
                </div>
                <div className="password-form-group">
                    <label>Επιβεβαίωση Νέου Κωδικού</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                        </span>
                    </div>
                </div>
                <button className="button-password" type="submit">Αλλαγή Κωδικού</button>
                <button className="cancel-button-password"  onClick={handleCancel}>Ακύρωση</button>
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default ChangePassword;
