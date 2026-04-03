# DreamCar

DreamCar is a premium vehicle rental management web app built for smooth customer bookings, admin approvals, and clean fleet management.

## Features

- User signup and login
- Admin login via `/admin/login`
- Vehicle explore and vehicle details pages
- Booking flow with custom calendar picker
- Location suggestions for pickup
- Payment method selection
- License details with DOB support
- User dashboard for bookings and saved vehicles
- Admin dashboard for bookings and license approvals
- Booking confirmation email with HTML template
- Dark and light theme switching
- MongoDB support with local fallback storage for development

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Express
- MongoDB with Mongoose
- Nodemailer

## Project Structure

- `src/` - frontend app
- `server/` - backend routes, controllers, models, and utilities
- `server/lib/mailer.ts` - booking confirmation email logic
- `server/lib/runtimeConfig.ts` - environment-based configuration
- `.env` - local environment values
- `.env.example` - safe sample environment values

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Create `.env`

```env
PORT=5001
NODE_ENV=development

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string

MAIL_FROM=DreamCar <your-email@gmail.com>
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

3. Start the app

```bash
npm run dev
```

4. Open

```txt
http://localhost:5000
```

## Email Setup

DreamCar uses Nodemailer for booking confirmation emails.

For Gmail:

- `EMAIL_USER` = your Gmail address
- `EMAIL_PASS` = your Gmail App Password
- `MAIL_FROM` = sender name and email

Example:

```env
MAIL_FROM=DreamCar <your-email@gmail.com>
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Notes

- If MongoDB is unavailable, the app can run in fallback mode for local development.
- `.env` is ignored from git.
- `.env.example` contains safe sample values.

## Author

Developed by Veerendra Kumar KR and Naveena C B
