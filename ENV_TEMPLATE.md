# Environment Variables Template

Copy this file to `.env.local` and fill in the actual values.

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# NextAuth.js
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth Providers (if needed)
# AUTH_GOOGLE_ID=your-google-client-id
# AUTH_GOOGLE_SECRET=your-google-client-secret
# AUTH_MICROSOFT_ID=your-microsoft-client-id
# AUTH_MICROSOFT_SECRET=your-microsoft-client-secret
```

## Setup Instructions

1. Create a Neon PostgreSQL database at https://neon.tech
2. Get the connection string from Neon
3. Generate a random secret for NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```
4. Copy the values to your `.env.local` file
5. Run `npm install` to install dependencies
6. Run database migration (see README.md)
