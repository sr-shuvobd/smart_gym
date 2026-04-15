# Smart Gym Management System 💪

A complete, modern web-based management system designed specifically for gymnasiums. It handles everything from member registrations, trainer schedules, custom workout & diet plans, and robust revenue tracking through secure online payments.

Developed as a University Project by **Group 4**.

## 🌟 Key Features

- **Role-Based Authentication**: Secure login mechanism tailored for Members, Trainers, and Admins using `bcrypt` encryption.
- **Admin Dashboard**: Comprehensive analytics dashboard to track total members, active trainers, and total gym revenue in real-time.
- **Member Management**: Track active/expired subscriptions and seamlessly assign personalized workout and diet plans.
- **Automated SSLCommerz Payments**: Members can renew their subscriptions (Monthly, Quarterly, Yearly) directly via an integrated Sandbox SSLCommerz Gateway (Supports Card, BKash, etc.).
- **Automatic Expiry Adjustments**: Subscriptions are instantly renewed upon successful payment callbacks without needing human intervention.
- **Offline Payment Support**: Admins can log direct cash transactions to automatically update members' records.
- **Custom Notifications**: Toast-based dynamic UI error handling and success alerts.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript.
- **Backend API**: Node.js, Express.js.
- **Database**: SQLite3 (Local File storage).
- **Security**: `cors`, `bcryptjs`.

## ⚙️ How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Instructions
1. Open your terminal and navigate to the project directory:
   ```bash
   cd "MY ALL Project/university project/smart_gym"
   ```
2. Install the necessary Node.js dependencies:
   ```bash
   npm install express cors sqlite3 bcryptjs
   ```
3. Start the node server:
   ```bash
   npm start
   ```
4. Open your browser and go to:
   ```text
   http://localhost:3000
   ```

## 🔐 Default Admin Credentials
To access the system as an Administrator:
- **Role:** Admin
- **Email:** `srs@gmail.com`
- **Password:** `1234`

(For Members and Trainers, use the Registration page on the website to create new accounts.)

## 📝 License
This project was developed for educational purposes.
