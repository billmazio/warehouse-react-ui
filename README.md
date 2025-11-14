# Warehouse Management System - React Frontend

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://www.javascript.com/)
[![Axios](https://img.shields.io/badge/Axios-1.x-purple)](https://axios-http.com/)

Responsive React frontend for warehouse inventory management with JWT authentication and role-based access control.

## 🔗 Related Repository
- **Backend API**: [warehouse-springboot-api](https://github.com/YOUR_USERNAME/warehouse-springboot-api)

---

## 🎯 Overview

Modern single-page application for managing clothing inventory across multiple store locations. Features real-time updates, intuitive UI, and seamless integration with Spring Boot backend.

**Key Features:**
- JWT token-based authentication
- Role-based UI (ADMIN, LOCAL_ADMIN)
- Real-time inventory management
- Multi-store operations
- Responsive design
- Greek language support

---

## 🛠️ Tech Stack

**Frontend:** React 18 • React Router • Axios • React Hooks • Custom CSS  
**Build Tools:** Node.js • npm • Create React App

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm
- Backend API running on `http://localhost:8080`

### Setup
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/warehouse-react-app.git
cd warehouse-react-app

# Install dependencies
npm install

# Start development server
npm start
```

Application available at `http://localhost:3000`

---

## 📱 Features

### Authentication
- Login with JWT tokens
- Protected routes
- Role-based access control
- Automatic token refresh

### Inventory Management
- View all materials with filtering
- Add/edit/delete materials
- Size and quantity management
- Search by product name

### Order Management
- Create orders linking users, materials, stores
- Edit order status and quantity
- View order history
- Delete orders

### Store & User Management
- Manage multiple stores
- Create users associated with stores
- Role assignment (ADMIN, LOCAL_ADMIN)
- Store-specific views

---

### Key Technologies
- **React Router**: Client-side routing with protected routes
- **Axios**: HTTP client for API calls with interceptors
- **React Hooks**: State management (useState, useEffect, useContext)
- **Custom CSS**: Responsive design with consistent styling

---

## 🔌 API Integration

All API calls go through Axios services with JWT token handling:
```javascript
// Example: Login
POST http://localhost:8080/api/auth/login

// Example: Get materials
GET http://localhost:8080/api/materials
Authorization: Bearer <token>
```
