Look at makefile for build
Ngrok works only for Abbas' account because of the specific link, localhost:8080 should still work
Make ngrok in separate tab then just make

# Transcendence

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js and npm
- ngrok account (free tier works)

### Initial Setup

1. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your ngrok credentials:**
   - Sign up at [ngrok.com](https://ngrok.com)
   - Go to your [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
   - Copy your authtoken

3. **Configure your `.env` file:**
   Add your ngrok credentials to the `.env` file:
   ```bash
   NGROK_AUTHTOKEN=<your_authtoken_here>
   NGROK_SITE=<your-custom-domain.ngrok-free.dev>
   JWT_SECRET=yourSecret
   JWT_ACCESS_TOKEN_MINUTES=10
   JWT_REFRESH_TOKEN_DAYS=30
   ```

4. **Build and run:**
   ```bash
   make
   ```

### Build Process

Look at Makefile for build details.

- First build will install and configure ngrok automatically
- The ngrok URL from your `.env` will be added to the allowed hosts in `vite.config.ts`
- Subsequent builds will skip ngrok installation if already configured

### Running the Application

- **With ngrok:** Start ngrok in a separate terminal tab (`make ngrok`), then run `make`
- **Local only:** Just run `make` - the app will be available at `localhost:8080`

**Note:** ngrok is currently configured for a specific account. Each developer needs their own ngrok account and configuration in their local `.env` file.
