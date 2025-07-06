import SigninPage from "@/components/forms/SigninForm";
import { Suspense } from "react";
const forgetPasswordPage = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <SigninPage />
      </Suspense>
    </>
  );
};
export default forgetPasswordPage;
