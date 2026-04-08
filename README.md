# MediNest - Clinic Management SaaS Platform

A modern, full-stack SaaS platform for clinic management, featuring AI-enhanced digital prescriptions, patient history tracking, and billing.

## 📁 Project Structure

- **/mnm-nextjs**: The modern frontend built with Next.js 16 (App Router), Tailwind CSS 4, and Supabase SSR.
- **/backend**: Node.js & Express server handling AI summary generation (NVIDIA NIM) and secure administrative tasks.
- **/superadmin**: A dedicated dashboard for managing clinic approvals and system-wide stats.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Supabase project with the database schema initialized.

### 2. Environment Setup
Create a `.env` file in the `backend` folder and a `.env.local` file in the `mnm-nextjs` folder with your Supabase credentials.

### 3. Run the Development Servers
From the root directory, run:
```bash
npm run dev
```
This will launch both the frontend (http://localhost:3000) and the backend (http://localhost:4000) concurrently.

## 🛠 Features
- **AI Prescription Summary**: Generates empathetic, layman summaries of medical prescriptions using Meta Llama 3.1.
- **Multi-Tenant Architecture**: Each clinic manages its own doctors, patients, and records.
- **Professional Exports**: Generate prescriptions as high-quality PDFs or images.
- **Patient History Timeline**: Complete medical history for every registered patient.

---
© 2026 MediNest SaaS Solutions
