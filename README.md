# MappingNexus

A full-stack resource planning and workforce management platform with AI-powered employee data ingestion, admin analytics, and subscription management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Setup Database:**
```bash
cd backend
# Create .env file with DATABASE_URL
# Run migrations
npx prisma migrate dev
# Seed admin user
npm run seed
```

3. **Configure Environment Variables:**

**Backend `.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mappingnexus
PORT=3001
NODE_ENV=development
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Frontend `.env`:**
```env
VITE_GROQ_API_KEY=your-groq-api-key
VITE_API_URL=http://localhost:3001
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🔐 Login Credentials

### Regular User Login
- **Email:** `tdhairyakumar@gmail.com`
- **Password:** `Dktwr@123`

### Admin Access
- **Email:** `tdhairyakumar@gmail.com`
- **PIN:** `041078`

**Note:** Login as regular user first, then navigate to Admin Analytics page and enter the PIN.

---

## 📁 Project Structure

```
mappingnexus/
├── backend/           # Express API server
│   ├── server.ts      # Main API server
│   ├── prisma/        # Database schema & migrations
│   └── seed.ts        # Database seeding
├── frontend/          # React + Vite frontend
│   ├── components/    # React components
│   ├── services/      # API client
│   └── utils/         # Utilities
└── README.md          # This file
```

---

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

**Backend:**
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- bcrypt (password hashing)
- Nodemailer (email service)

**AI/ML:**
- Groq API (for CV/resume analysis)

---

## ✨ Features

- **User Authentication:** Signup, login, password reset with OTP
- **Employee Management:** Add, view, delete employees
- **AI-Powered Data Ingestion:** Smart upload for CV/resume parsing
- **Admin Dashboard:** Customer management, revenue tracking, subscription approval
- **Subscription Management:** Tiered access (Standard/VIP)
- **Role-Based Access Control:** Standard users, VIP users, Admin

---

## 🔧 Development

### Database Commands
```bash
cd backend
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations
npx prisma studio           # Open Prisma Studio
npm run seed                # Seed database
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password

### Employees
- `GET /api/employees?userId=xxx` - Get user's employees
- `POST /api/employees` - Add employee
- `DELETE /api/employees/:id` - Delete employee

### Admin
- `POST /api/admin/verify` - Verify admin PIN
- `GET /api/admin/customers` - Get all customers
- `POST /api/admin/approve` - Approve subscription
- `POST /api/admin/revoke` - Revoke subscription
- `GET /api/admin/revenue` - Get revenue data
- `GET /api/admin/transactions` - Get all transactions

---

## 🔒 Security Notes

- Passwords are hashed using bcrypt
- Admin PIN verification required for admin endpoints
- CORS configured for local development
- Environment variables for sensitive data
- **Note:** Currently admin endpoints are not fully protected - add middleware in production

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Run `npx prisma generate` if Prisma errors

**Frontend proxy errors:**
- Ensure backend is running on port 3001
- Check `VITE_API_URL` in frontend `.env`

**Login not working:**
- Verify database is seeded: `npm run seed` in backend
- Check backend logs for errors

---

## 📄 License

Private - Pre-seed Startup

---

## 👤 Contact

For issues or questions, contact the development team.
