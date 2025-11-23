# YogVaidya

YogVaidya is a comprehensive yoga streaming and wellness platform connecting users with mentors for yoga, meditation, and diet planning.

## Features

- **User & Mentor Roles**: Distinct dashboards and features for Students and Mentors.
- **Video Streaming**: Watch yoga and meditation classes.
- **Live Sessions**: Book and join live sessions with mentors.
- **Diet Plans**: Personalized diet plans created by mentors.
- **Authentication**: Secure login via Email/Password and Google OAuth (using Better Auth).
- **Payments**: Integrated with Razorpay for subscriptions and session bookings.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth
- **Testing**: Vitest (Unit) & Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Database
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/yogvaidya.git
    cd yogvaidya
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Environment Setup:
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    - Update `.env` with your actual credentials.
    - **Important**: Ensure `DATABASE_URL` is set to your MongoDB connection string.

### Running Locally

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

- **Unit Tests**:
    ```bash
    npm test
    ```
- **E2E Tests**:
    ```bash
    npm run e2e
    ```

### Building for Production

1.  Generate Prisma Client:
    ```bash
    npx prisma generate
    ```
2.  Build the application:
    ```bash
    npm run build
    ```
3.  Start the production server:
    ```bash
    npm start
    ```

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions, database configuration, and services.
- `prisma`: Database schema and migrations.
- `__tests__`: Unit tests.
- `e2e`: End-to-End tests.

## Contributing

1.  Fork the project.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
