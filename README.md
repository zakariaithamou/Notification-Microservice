# Centralized Notification Microservice

## Project Description

This project is a Notification-as-a-Service (NaaS) backend designed to centralize how university departments send communications. Instead of each department managing its own disconnected email or SMS scripts, they submit a single API request to this microservice. The service then handles validating the request, rendering the specific template, and queuing the message for delivery.

Key benefits of this decoupled architecture include:

- **Consistency:** Centralized template management ensures uniform formatting across all department communications.

- **Reliability:** Built-in auto-retry mechanisms ensure that failed messages are queued and retried (e.g., after 10 minutes) rather than being silently dropped.

- **Auditability:** Every notification is tracked and logged with a status (`pending`, `sent`, `retrying`, or `failed_final`) so administrators know exactly what was sent, to whom, and if it succeeded.

## Documentation

> **System Architecture:** For a deep dive into how this microservice works under the hood—including the RabbitMQ message queues, security flows, and database models—please read the [Architecture Documentation](docs/ARCHITECTURE.md).

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

# NMS - Environment Variables

The `.env.local` file contains all secret keys required to run the Notification Microservice. This file should **never be committed** to version control.

## Required Secret Keys

```env
# ========================
# DATABASE CONFIGURATION
# ========================
# MongoDB connection string for development database
# Get from: MongoDB Atlas > Connect > Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# ========================
# EMAIL SERVICE (RESEND)
# ========================
# Resend API Key for sending emails
# Get from: Resend Dashboard > API Keys > https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Email sender address formatted with display name
# Format: "Display Name <email@domain.com>"
RESEND_FROM_EMAIL="Dashboard Security <no-reply@zakarianms.me>"

# ========================
# SMS SERVICE (TWILIO)
# ========================
# Twilio Account SID for SMS authentication
# Get from: Twilio Console > Account > Account SID > https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx

# Twilio Auth Token for API requests
# Get from: Twilio Console > Account > Auth Token > https://console.twilio.com
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx

# Twilio virtual phone number (sender ID for SMS)
# Get from: Twilio Console > Phone Numbers > Manage Active Numbers
TWILIO_PHONE_NUMBER=+1234567890

# Your personal/verified phone number for testing SMS
MY_VERIFIED_NUMBER=+212xxxxxxxxx

# ========================
# ADMIN AUTHENTICATION
# ========================
# Admin username for dashboard access
ADMIN_USERNAME=admin

# Admin API key for internal API protection
# Generate with: Any random alphanumeric string
ADMIN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# ========================
# AI SERVICE (GEMINI)
# ========================
# Google Gemini API Key for AI-powered template generation
# Get from: Google AI Studio > API Keys > https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIxxxxxxxxxxxxxxxxxxxxxx

# ========================
# SESSION MANAGEMENT
# ========================
# Secret key for signing session tokens
# Generate with: openssl rand -base64 32
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

## How to Use `.env.local`

1. Create a `.env.local` file in the project root
2. Copy the template above and fill in your actual credentials
3. **Never commit** this file to Git (it's in `.gitignore`)
4. Keep this file secure and only share with trusted team members

---

# How to Run the Notification Microservice Locally

To run the full architecture (Frontend, API, Message Queue, Background Worker, and Webhooks), you need **four separate terminal windows**.

## Prerequisites

- Docker Desktop installed and running
- Node.js and npm installed
- Cloudflare Tunnel CLI installed (`npm install -g @cloudflare/wrangler`)
- `.env.local` file configured with all required keys

## Step 1: Start RabbitMQ (The Queue)

**Terminal 1:**

```bash
docker start rabbitmq
```

> **Note:** If the container doesn't exist yet, create it first:
>
> ```bash
> docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
> ```
>
> Access RabbitMQ Dashboard at http://localhost:15672 (credentials: guest/guest)

## Step 2: Start the Background Worker (The Consumer)

This script listens to RabbitMQ and processes the emails.

**Terminal 2:**

```bash
npx tsx --env-file=.env.local workers/emailWorker.ts
```

**Expected log output:**

```
 Worker listening for messages in email_queue...
```

## Step 3: Generate the Webhook URL (Cloudflare Tunnel)

This exposes your local server to the internet so Resend can send delivery updates.

**Terminal 3:**

```bash
npx cloudflared tunnel --url http://localhost:3000
```

**Action Required:**

1. Copy the generated link (e.g., `https://[random-words].trycloudflare.com`)
2. Append your webhook route: `/api/webhooks/resend`
3. Go to **Resend Dashboard > Webhooks**
4. Paste the full URL so Resend knows where to send tracking data

## Step 4: Start the Next.js Application (The API & UI)

This runs your main application and dashboard.

**Terminal 4:**

```bash
npm run dev
```

**Expected output:**

```
▲ Next.js (version)
- Local: http://localhost:3000
```

## System Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  Resend     │         │  Next.js API │         │  RabbitMQ    │
│  (Email)    │────────▶│  (Microserv) │────────▶│  (Queue)     │
└─────────────┘         └──────────────┘         └──────────────┘
       ▲                        ▲                        │
       │                        │                        │
       │                   MongoDB                       │
       │                   (Store)                       ▼
       │                                        ┌──────────────┐
       │                                        │  Email       │
       │                                        │  Worker      │
       │                                        │  (Consumer)  │
       │                                        └──────────────┘
       └────────────────────────────────────────────────┘
           (Email Status Updates via Webhook)
```

## Verification Checklist

- ✅ RabbitMQ running (dashboard accessible at http://localhost:15672)
- ✅ Background worker listening for messages
- ✅ Cloudflare tunnel active with webhook URL configured in Resend
- ✅ Next.js application running at http://localhost:3000
- ✅ All environment variables in `.env.local` are populated
- ✅ MongoDB Atlas connection working
