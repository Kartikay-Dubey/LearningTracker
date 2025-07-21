
# 🚀 LearnTrack - Personal Learning Tracker

![LearnTrack Hero Image](image.png)
<!-- 
TODO: 
1. Take a beautiful, wide screenshot of your application's dashboard or homepage.
2. Upload it to a site like Imgur (https://imgur.com/upload).
3. Copy the "Direct Link" and paste it to replace the placeholder link above.
-->

A modern, gamified, and feature-rich web application designed to help users track their learning goals, monitor progress, and stay motivated through an engaging achievement system. Built from the ground up with a professional tech stack, this app provides a seamless and interactive user experience.

---

## ✨ Key Features

-   **🔐 Secure Authentication**: Full user login/signup functionality powered by Supabase, including social logins (Google, GitHub, etc.).
-   **📊 Interactive Dashboard**: A central hub to view learning stats, recent activity, and overall progress at a glance with beautiful charts and graphs.
-   **🎯 Goal Management**: Easily create, update, and delete learning goals through a sleek and intuitive modal interface.
-   **🏆 Gamification & Achievements**: A built-in system with badges, trophies, streaks, and XP to motivate users and celebrate milestones.
-   **🎨 Modern & Responsive UI**: A beautiful, mobile-first design with light/dark modes, built with Tailwind CSS for a clean and consistent look.
-   **Smooth Animations**: Fluid and delightful animations powered by Framer Motion to enhance the user experience.
-   **☁️ Cloud Data Storage**: All user data (profiles, goals, achievements) is securely stored in the cloud, accessible from any device.
-   **👤 Customizable Profiles**: Users can edit their name and upload a custom avatar, which is securely stored using Supabase Storage.

---

## 🛠️ Tech Stack & Tools

This project is built with a modern, scalable, and professional technology stack:

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer-black?style=for-the-badge&logo=framer&logoColor=blue)
![Zustand](https://img.shields.io/badge/Zustand-4D2A2A?style=for-the-badge&logo=react&logoColor=white)

-   **Framework**: React 18
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Backend & Database**: Supabase (Auth, Postgres, Storage)
-   **Animations**: Framer Motion
-   **State Management**: Zustand
-   **Icons**: Lucide React
-   **Charts**: Recharts

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### **Prerequisites**

-   Node.js (v18.x or higher)
-   npm or yarn
-   A free Supabase account ([signup here](https://supabase.com/))

### **Installation & Setup**

1.  **Clone the repository**
    ```sh
    git clone https://github.com/your-username/learning-tracker-app.git
    cd learning-tracker-app
    ```

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Set up your environment variables**
    -   Create a file named `.env` in the root of your project.
    -   Log in to your Supabase project dashboard.
    -   Go to **Project Settings** > **API**.
    -   Find your **Project URL** and your **anon public key**.
    -   Add them to your `.env` file like this:
        ```env
        VITE_SUPABASE_URL=https://your-project-url.supabase.co
        VITE_SUPABASE_ANON_KEY=your-anon-public-key
        ```

4.  **Set up the Supabase database and storage**
    -   In your Supabase project, use the **SQL Editor** to create the `profiles` table using the schema defined in this project.
    -   Enable **Row Level Security (RLS)** on the `profiles` table and add policies for `INSERT`, `SELECT`, and `UPDATE`.
    -   Go to the **Storage** section, create a new **public** bucket named `avatars`.
    -   Add RLS policies to the `avatars` bucket to allow users to manage their own files.

5.  **Run the application**
    ```sh
    npm run dev
    ```
    The application should now be running on `http://localhost:5173`.

---

## 📞 Contact

Kartikay Dubey - https://www.linkedin.com/in/kartikay-dubey-98ba73313/

Project Link: [https://github.com/your-username/learning-tracker-app](https://github.com/Kartikay-Dubey/LearningTracker)

<!-- Don't forget to replace the placeholder links above with your actual social and GitHub links! -->
```