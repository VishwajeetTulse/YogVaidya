import SignupPage from "@/components/forms/SignupForm";
import { Suspense } from "react";

const signupPage = () => {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <SignupPage />
      </Suspense>
    </>
  );
};
export default signupPage;
