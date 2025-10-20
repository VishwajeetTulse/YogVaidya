/**
 * YogVaidya API OpenAPI 3.0 Specification
 * Comprehensive API documentation for all endpoints
 * Generated for production use
 */

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "YogVaidya API",
    description: "Complete REST API for YogVaidya yoga and meditation platform",
    version: "1.0.0",
    contact: {
      name: "YogVaidya Support",
      url: "https://yogvaidya.com",
      email: "support@yogvaidya.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Development server",
    },
    {
      url: "https://api.yogvaidya.com",
      description: "Production server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User management" },
    { name: "Mentors", description: "Mentor operations" },
    { name: "Sessions", description: "Session management" },
    { name: "Bookings", description: "Booking operations" },
    { name: "Subscriptions", description: "Subscription management" },
    { name: "Payments", description: "Payment processing" },
    { name: "Chat", description: "Chat and messaging" },
    { name: "Analytics", description: "Analytics and reporting" },
    { name: "Admin", description: "Admin operations" },
  ],
  paths: {
    "/auth/signin": {
      post: {
        tags: ["Auth"],
        summary: "User Sign In",
        description: "Authenticate user with email and password",
        operationId: "signIn",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    minLength: 8,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Sign in successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    token: { type: "string" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "User Sign Up",
        description: "Create new user account",
        operationId: "signUp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password", minLength: 8 },
                  name: { type: "string", minLength: 2 },
                  phone: { type: "string", pattern: "^[0-9]{10}$" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": {
            description: "Invalid input or email already exists",
          },
        },
      },
    },
    "/users/{userId}": {
      get: {
        tags: ["Users"],
        summary: "Get User Profile",
        description: "Retrieve user profile information",
        operationId: "getUserProfile",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "404": { description: "User not found" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update User Profile",
        description: "Update user profile information",
        operationId: "updateUserProfile",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  bio: { type: "string" },
                  avatar: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": { description: "Invalid update data" },
        },
      },
    },
    "/mentors": {
      get: {
        tags: ["Mentors"],
        summary: "List Mentors",
        description: "Get list of available mentors with filtering",
        operationId: "listMentors",
        parameters: [
          {
            name: "role",
            in: "query",
            schema: { type: "string", enum: ["yoga", "meditation", "fitness"] },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "inactive"] },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "List of mentors retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Mentor" },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/sessions": {
      post: {
        tags: ["Sessions"],
        summary: "Book Session",
        description: "Book a new session with mentor",
        operationId: "bookSession",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mentorId", "sessionTypeId", "startTime"],
                properties: {
                  mentorId: { type: "string" },
                  sessionTypeId: { type: "string" },
                  startTime: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Session booked successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Session" },
              },
            },
          },
          "400": { description: "Invalid session data" },
          "409": { description: "Time slot already booked" },
        },
      },
      get: {
        tags: ["Sessions"],
        summary: "List User Sessions",
        description: "Get user's session history",
        operationId: "listSessions",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["scheduled", "completed", "cancelled"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Sessions retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Session" },
                },
              },
            },
          },
        },
      },
    },
    "/sessions/{sessionId}": {
      get: {
        tags: ["Sessions"],
        summary: "Get Session Details",
        operationId: "getSessionDetails",
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Session details retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Session" },
              },
            },
          },
          "404": { description: "Session not found" },
        },
      },
    },
    "/subscriptions": {
      post: {
        tags: ["Subscriptions"],
        summary: "Create Subscription",
        description: "Start subscription to a plan",
        operationId: "createSubscription",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["planId"],
                properties: {
                  planId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Subscription created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Subscription" },
              },
            },
          },
        },
      },
      get: {
        tags: ["Subscriptions"],
        summary: "Get Current Subscription",
        operationId: "getCurrentSubscription",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current subscription retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Subscription" },
              },
            },
          },
          "404": { description: "No active subscription" },
        },
      },
    },
    "/payments/razorpay/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Razorpay Webhook",
        description: "Handle Razorpay payment webhooks",
        operationId: "razorpayWebhook",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  payload: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Webhook processed" },
          "400": { description: "Invalid webhook" },
        },
      },
    },
    "/chat": {
      post: {
        tags: ["Chat"],
        summary: "Send Chat Message",
        description: "Send message to AI chat assistant",
        operationId: "sendChatMessage",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", minLength: 1, maxLength: 5000 },
                  conversationId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Chat response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    response: { type: "string" },
                    conversationId: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/analytics/user-stats": {
      get: {
        tags: ["Analytics"],
        summary: "Get User Statistics",
        operationId: "getUserStats",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User statistics",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserStats" },
              },
            },
          },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List All Users (Admin)",
        operationId: "adminListUsers",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "role",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
          "403": { description: "Unauthorized - Admin access required" },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "email", "name"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          phone: { type: "string" },
          avatar: { type: "string", format: "uri" },
          role: { type: "string", enum: ["student", "mentor", "admin"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Mentor: {
        allOf: [
          { $ref: "#/components/schemas/User" },
          {
            type: "object",
            properties: {
              expertise: { type: "string" },
              bio: { type: "string" },
              rating: { type: "number", minimum: 0, maximum: 5 },
              reviewCount: { type: "integer" },
              hourlyRate: { type: "number", minimum: 0 },
            },
          },
        ],
      },
      Session: {
        type: "object",
        required: ["id", "mentorId", "studentId", "startTime"],
        properties: {
          id: { type: "string", format: "uuid" },
          mentorId: { type: "string" },
          studentId: { type: "string" },
          sessionTypeId: { type: "string" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["scheduled", "in-progress", "completed", "cancelled"],
          },
          notes: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Subscription: {
        type: "object",
        required: ["id", "userId", "planId", "status"],
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string" },
          planId: { type: "string" },
          status: {
            type: "string",
            enum: ["active", "paused", "cancelled", "expired"],
          },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          renewalDate: { type: "string", format: "date" },
          sessionsRemaining: { type: "integer" },
          totalSessions: { type: "integer" },
        },
      },
      UserStats: {
        type: "object",
        properties: {
          totalSessions: { type: "integer" },
          completedSessions: { type: "integer" },
          totalMinutes: { type: "integer" },
          currentStreak: { type: "integer" },
          favoriteSessionType: { type: "string" },
          averageRating: { type: "number" },
        },
      },
      Error: {
        type: "object",
        required: ["message", "code"],
        properties: {
          message: { type: "string" },
          code: { type: "string" },
          details: { type: "object" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT authentication token",
      },
    },
  },
  security: [{ bearerAuth: [] }],
};
