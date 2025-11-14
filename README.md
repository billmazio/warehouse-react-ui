# Warehouse Management System - React Frontend

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://www.javascript.com/)
[![Axios](https://img.shields.io/badge/Axios-1.x-purple)](https://axios-http.com/)
[![Playwright](https://img.shields.io/badge/E2E%20Tests-20%2B-green)](https://playwright.dev/)

Responsive React frontend for warehouse inventory management with JWT authentication and role-based access control.

## 🔗 Related Repository
- **Backend API**: [warehouse-springboot-api](https://github.com/billmazio/warehouse-springboot-api)

---

## 🎯 Overview

Modern single-page application for managing clothing inventory across multiple store locations. Features real-time updates, intuitive UI, and seamless integration with Spring Boot backend. Fully tested with 20+ automated E2E tests using Playwright.

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

**Testing:** Playwright E2E tests (see backend repository)

---
## 📱 Application Structure
```
src/
├── components/           # 6 feature components
│   ├── Dashboard/
│   ├── MaterialsList/
│   ├── OrderManagement/
│   ├── PrivateRoute/
│   ├── StoreManagement/
│   └── UserManagement/
├── pages/               # 3 main pages
│   ├── ChangePassword/
│   ├── Login/
│   └── Setup/
├── services/            # API integration (Axios)
├── utils/               # Helper utilities
└── App.js               # Main routing & layout
```

### Core Features

**Authentication:**
- Login with JWT tokens
- Protected routes
- Role-based access control
- Automatic token refresh

**Inventory Management:**
- View all materials with filtering
- Add/edit/delete materials
- Size and quantity management
- Search by product name

**Order Management:**
- Create orders linking users, materials, stores
- Edit order status and quantity
- View order history
- Delete orders

**Store & User Management:**
- Manage multiple stores
- Create users associated with stores
- Role assignment (ADMIN, LOCAL_ADMIN)
- Store-specific views

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm
- Backend API running on `http://localhost:8080`

### Setup
```bash
# Clone repository
git clone https://github.com/billmazio/warehouse-react-ui.git
cd warehouse-react-ui

# Install dependencies
npm install

# Start development server
npm start
```

Application available at `http://localhost:3000`

### Environment Configuration

Create `.env` file for API endpoint:
```bash
REACT_APP_API_URL=http://localhost:8080/api
```

---

## 🔌 API Integration

All API calls go through Axios services with JWT token handling:
```javascript
// Example: Login
POST http://localhost:8080/api/auth/login
Content-Type: application/json
Body: { "username": "admin", "password": "password" }

// Example: Get materials
GET http://localhost:8080/api/materials
Authorization: Bearer <token>

// Example: Create order
POST http://localhost:8080/api/orders
Authorization: Bearer <token>
Content-Type: application/json
Body: { "userId": 1, "materialId": 2, "storeId": 1, "sizeId": 3, "quantity": 10 }
```

**API Service Features:**
- Axios interceptors for automatic token injection
- Error handling and unauthorized (401) redirects
- Request/response logging
- Token refresh on expiration

---

## 🧪 Testing

This frontend is covered by **20+ E2E tests** using Playwright (located in backend repository).

**Test Coverage:**
- Authentication flows (login, validation, errors)
- Materials CRUD operations
- Orders creation and management
- Stores and users management
- Role-based access control

See [warehouse-springboot-api](https://github.com/billmazio/warehouse-springboot-api) for test suite details.

---

## 🌐 Key Technologies

- **React Router**: Client-side routing with protected routes
- **Axios**: HTTP client for API calls with interceptors
- **React Hooks**: State management (useState, useEffect, useContext)
- **Context API**: Global auth state management
- **Custom CSS**: Responsive design with consistent styling
