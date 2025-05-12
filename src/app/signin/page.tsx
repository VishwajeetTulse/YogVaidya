import SigninPage from "@/components/SigninForm";
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