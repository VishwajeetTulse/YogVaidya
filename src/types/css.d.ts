/**
 * CSS Module Type Declarations
 * Handles side-effect imports for CSS files
 */

// Generic CSS imports
declare module "*.css";
declare module "*.scss";
declare module "*.sass";

// Path alias CSS imports for Next.js app directory
declare module "@/app/globals.css";
declare module "@/app/*.css";
