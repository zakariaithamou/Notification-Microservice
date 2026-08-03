# Centralized Notification Microservice

## Project Description

This project is a Notification-as-a-Service (NaaS) backend designed to centralize how university departments send communications. Instead of each department managing its own disconnected email or SMS scripts, they submit a single API request to this microservice. The service then handles validating the request, rendering the specific template, and queuing the message for delivery.

Key benefits of this decoupled architecture include:

- **Consistency:** Centralized template management ensures uniform formatting across all department communications.

- **Reliability:** Built-in auto-retry mechanisms ensure that failed messages are queued and retried (e.g., after 10 minutes) rather than being silently dropped.

- **Auditability:** Every notification is tracked and logged with a status (`pending`, `sent`, `retrying`, or `failed_final`) so administrators know exactly what was sent, to whom, and if it succeeded.

## Technologies

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Database:** MongoDB with Mongoose for schema modeling
- **Validation:** Zod (or Joi) for incoming API request validation
- **Queue & Retry Logic:** BullMQ and Redis (or MongoDB + Cron job for MVP)
- **Email Provider:** Nodemailer (via SMTP/SendGrid/SES)
- **SMS Provider:** Twilio or local SMS gateway

## Folder Structure

```
/
├── app/
│   └── api/          # Next.js API routes for endpoints
├── lib/
│   └── models/       # Mongoose schemas (Departments     Department.ts     Templates, Notifications)
├── services/         # Core logic (Template rendering, email/SMS dispatch)
└── .env.local        # Environment secrets
```

# NMS- Database Setup

This guide explains how to set up, connect, and verify the MongoDB database for this microservice.

## 1. MongoDB Atlas Setup

To run this project locally, you need a MongoDB Atlas cluster.

1. Create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com/).
2. Under **Database Access**, create a new database user with a username and password.
3. Under **Network Access**, click **Add IP Address** and whitelist your current IP address (or `0.0.0.0/0` for development).
4. Go to your cluster, click **Connect**, select **Drivers**, and copy your connection string.

## 2. Environment Variables

Create a `.env.local` file in the root of your project and add your MongoDB connection string. Replace `<username>`, `<password>`, and `<database_name>` with your actual credentials:

```env
MONGO_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/<database_name>?retryWrites=true&w=majority
```
