import React, { Suspense } from "react";
import ResetPassword from "@/components/reset-password";

const resetPasswordPage = () => {
  return (
    <>
      <Suspense>
        <ResetPassword />
      </Suspense>
    </>
  );
};
export default resetPasswordPage;
