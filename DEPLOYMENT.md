# Deployment Guide — Detailed Instructions

To host your project for free, you will use two platforms:
1.  **[Neon](https://neon.tech/)**: For your PostgreSQL database (already configured in `.env`).
2.  **[Render](https://render.com/)**: For your NestJS backend.

---

## 🏗️ Step 1: Database (Neon)
Your project is already configured to use **Neon**. 
1.  Go to [Neon.tech](https://neon.tech/) and log in (use GitHub).
2.  In your dashboard, you will see your project `neondb`.
3.  Click on **Connection Details** to find your hostname, username, and password if you need them later.
4.  **Note**: Your current `.env` already has these details, so you don't need to create a new one unless you want to.

## 🚀 Step 2: Backend (Render)
1.  **Push your code to GitHub**: Make sure all changes (including `Dockerfile` and `render.yaml`) are pushed.
2.  **Login to Render**: Go to [Render.com](https://render.com/) and sign up/log in with GitHub.
3.  **New Blueprint**: 
    - Click **New +** -> **Blueprint**.
    - Connect your GitHub repository.
    - **Note on Branch**: If Render says `render.yaml` not found, make sure you selected the branch that has the file (e.g., `main` or `TOT-004`), not `develop`.
    - Render will read the `render.yaml` file and set everything up automatically.
4.  **Environment Variables**:
    - During setup, Render will ask you to fill in the missing environment variables. 
    - Use the table below to fill them in from your local `.env` or Neon dashboard:

| Variable | Value / Source |
| :--- | :--- |
| `POSTGRES_HOST` | From Neon (e.g., `ep-blue-mouse-...`) |
| `POSTGRES_USER` | From Neon (e.g., `neondb_owner`) |
| `POSTGRES_PASSWORD` | From Neon |
| `POSTGRES_DB` | `neondb` (usually) |
| `JWT_SECRET` | Create a long random string (e.g., `uR8#z2K!p9@mS5`) |
| `SMTP_PASSWORD` | From Mailtrap (already in your `.env`) |
| `CORS_ORIGIN` | Your Frontend URL (e.g., `https://trace-of-the-tide.vercel.app`) |

    - Leave other variables like `PORT` and `NODE_ENV` as defaults if provided by `render.yaml`.

## 🔗 Step 3: Connect Frontend
Once the backend is live at `https://your-app.onrender.com`:
1.  Update your **Frontend**'s API URL to point to this new address.
2.  Update the `CORS_ORIGIN` variable in **Render Dashboard** to your frontend's URL (e.g., `https://your-frontend.vercel.app`).

---

> [!TIP]
> Render's free tier "spins down" after inactivity. The first request after a break might take 30-60 seconds to wake it up.
