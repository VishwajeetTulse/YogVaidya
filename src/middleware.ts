import { createMiddleware } from "better-auth/next-js";
import { auth } from "./server/auth";

export default createMiddleware({
  auth,
  protectedRoutes: [
    "/mentors/apply", // Protect the mentor application page
    "/dashboard", // Protect future dashboard pages
    "/profile", // Protect user profile pages
  ],
  loginPage: "/signin",
}); 