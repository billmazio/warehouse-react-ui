# Warehouse Management System - Frontend Documentation

## Table of Contents
1. [Frontend Overview](#frontend-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Key Features](#key-features)
6. [Prerequisites](#prerequisites)

## Frontend Overview

The frontend of the Warehouse Management System provides a responsive and intuitive user interface for clothing inventory management across multiple store locations. It handles user interactions, data presentation, and communicates with the backend API to perform operations.

### Key Objectives
- Provide an intuitive user interface for inventory management
- Implement role-based access control UI components
- Display real-time inventory status and updates
- Support multi-store operation views
- Enable size and quantity management for clothing items

### Target Users
- Store employees with LOCAL_ADMIN privileges
- System administrators with SUPER_ADMIN privileges
- Inventory managers and warehouse staff

## Architecture

The frontend follows a component-based architecture using React.js:

```
┌─────────────────────────────────────────┐
│                Frontend                 │
│                                         │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │   Components│    │  State Management│ │
│  │             │◄──►│   (React Hooks)  │ │
│  └─────────────┘    └─────────────────┘ │
│          ▲                  ▲           │
│          │                  │           │
│          ▼                  ▼           │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │    Router   │    │   API Services  │ │
│  │             │    │     (Axios)     │ │
│  └─────────────┘    └─────────────────┘ │
│                          ▲              │
└──────────────────────────┼──────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Backend API    │
                  │  (Spring Boot)  │
                  └─────────────────┘
```

### Key Components
- **Components Layer**: Reusable UI components
- **State Management**: React Hooks for state and lifecycle management
- **Router**: React Router for navigation and route protection
- **API Services**: Axios for communication with backend services

## Technology Stack

### Core Technologies
- **React.js 18+**: Modern JavaScript library for building user interfaces
- **React Router**: Declarative routing for React applications
- **Axios**: Promise-based HTTP client for API communication
- **Custom CSS**: Responsive styling with consistent design system

### State Management
- **React Hooks**: useState, useEffect, useContext, useReducer
- **Custom Hooks**: For shared functionality across components

### Development Tools
- **Node.js 16+**: JavaScript runtime for frontend development
- **npm**: Package manager for JavaScript
- **ESLint**: JavaScript linting tool
- **Prettier**: Code formatter
- **Create React App**: React application bootstrapping

## Key Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (SUPER_ADMIN, LOCAL_ADMIN)
- Protected routes based on user roles
- Login/logout functionality

### Inventory Management
- Clothing item listing with filtering and sorting
- Detailed item views with size and quantity information
- Add/edit/delete inventory items
- Quantity adjustment operations

### Store Management
- Multi-store view and management
- Store-specific inventory views
- Transfer items between stores
- Store performance metrics

### User Interface
- Responsive design for various screen sizes
- Intuitive navigation with sidebar and breadcrumbs
- Consistent styling across components
- Form validation and error handling

## Prerequisites

To set up and run the frontend application:

- Node.js 16+ installed
- npm package manager
- Modern web browser (Chrome, Firefox, Edge)
- Backend services running and accessible

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/warehouse-management-system.git

# Navigate to frontend directory
cd warehouse-management-system/frontend

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:3000`.
