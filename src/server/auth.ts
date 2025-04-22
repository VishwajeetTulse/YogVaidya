import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { createMongoAdapter } from "better-auth/mongodb-adapter";

// Initialize MongoDB connection
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);
const database = client.db("yogavaidya");

// Create adapter for MongoDB
const adapter = createMongoAdapter({
  client: database,
  collections: {
    users: "users",
    sessions: "sessions",
    verificationTokens: "verification_tokens",
    accounts: "accounts"
  }
});

export const auth = betterAuth({
  adapter,
  secret: process.env.AUTH_SECRET || "your-secret-key-change-in-production",
  baseURL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  emailAndPassword: {
    enabled: true,
    // Email verification is enabled by default
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
}); 