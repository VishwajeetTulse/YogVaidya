import SignupPage from "@/components/SignupForm";
import { Suspense } from "react";

const signupPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <SignupPage />
      </Suspense>
    </>
  );
};
export default signupPage;
