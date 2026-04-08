# Sishu Swasthya Kendra - Clinic Management System

This project is structured into a modern full-stack architecture with a dedicated frontend and backend.

## 📁 Project Structure
- **/frontend**: HTML, CSS, and Vanilla Javascript (the clinic dashboard).
- **/backend**: Node.js & Express server handling secure credentials and database operations.

## 🚀 How to Run

### Step 1: Database Initialization
1.  Log in to your **Supabase Dashboard**.
2.  Go to the **SQL Editor** section.
3.  Paste and run the content of `frontend/full_rebuild.sql` to set up all tables and initial settings.

### Step 2: Set Up Backend
1.  Open your terminal and navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install the required dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    *Note: The server will run on `http://localhost:4000`.*

### Step 3: Set Up Frontend
1.  Open the `frontend` directory in your preferred code editor (like VS Code).
2.  Launch `index.html` using a local server (like the **Live Server** extension in VS Code).
3.  If you don't have an extension, you can run this from the project root:
    ```bash
    npx serve frontend
    ```

## 🛠 Features
- **Prescription Generator**: Create professional prescriptions and save them directly to the database.
- **Patient History**: Access a full medical timeline for any patient by name or phone number.
- **Receptionist Portal**: Manage billing, appointments, and patient intake.
- **Doctor Hub**: Centralized console for clinical summaries and analytics.

---
© 2026 Sishu Swasthya Kendra Console
