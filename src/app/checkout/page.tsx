import { Suspense } from "react";
import Checkout from "../../components/Checkout";

export default function Page() {
  return (
    <Suspense fallback={<div className='text-center mt-10'>Loading...</div>}>
      <Checkout />
    </Suspense>
  );
} 