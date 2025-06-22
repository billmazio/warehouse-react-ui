# Clothing Management System - Frontend

## Project Description

This is the React frontend for a clothing inventory management system. It provides a responsive user interface for managing clothing inventory across multiple store locations, with different views based on user roles.

## Technologies Used:

- React.js
- Custom CSS components
- Axios for API communication
- JWT Authentication
- React Router for navigation
- React Hooks for state management

## Key Features:

- Responsive dashboard UI
- Role-based interface (SUPER_ADMIN vs LOCAL_ADMIN views)
- Material/clothing inventory management
- Store management interface
- Size selection components
- Quantity tracking and updates
- Interactive modal components
- Form validation

## UI Components:

- **Store Management**
  - Store listing with filters
  - Create/edit/delete store modals
  - Store status toggle

- **Material Management**
  - Inventory listing with filters and pagination
  - Add/edit/delete material modals
  - Size and quantity selectors

- **Authentication**
  - Login form
  - JWT token handling
  - Role-based route protection

- **Common Components**
  - Responsive tables
  - Modal dialogs
  - Form elements
  - Navigation menu

## Styling Approach

The application uses custom CSS for all styling, with a consistent design system including:

- Color scheme based on blue, green, and red accents
- Consistent button styling by action type
- Responsive tables with alternating row colors
- Modal dialogs for all forms
- Mobile-friendly layout adjustments

## Getting Started

1. Ensure you have Node.js installed
2. Install dependencies with `npm install`
3. Configure API base URL in `src/services/api.js`
4. Start development server with `npm start`

## API Integration

The frontend communicates with the Spring Boot backend via REST APIs for:
- User authentication and role management
- Store CRUD operations
- Material/inventory management
- Size reference data

## Screenshots

*(Include screenshots of key interfaces here)*

---

*Frontend documentation for GitHub repository*
