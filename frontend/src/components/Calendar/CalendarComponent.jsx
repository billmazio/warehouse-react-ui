import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CalendarComponent.css"; // Custom styles

const CalendarComponent = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateChange = (date) => {
        setSelectedDate(date);
        console.log("Selected Date:", date); // For debugging
    };

    return (
        <div className="calendar-component-container">
            <h3>Ημερολόγιο</h3>
            <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                showNeighboringMonth={true} // Show days from adjacent months
                locale="el-GR" // Greek localization (optional)
            />
        </div>
    );
};

export default CalendarComponent;
