'use client'

import { useSearchParams } from "next/navigation";

export default function Checkout() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  const planDetails = {
    seed: {
      name: "Seed",
      price: 0,
      description: "Best for beginners: One yoga session, Basic yoga poses, Online support, Email assistance."
    },
    bloom: {
      name: "Bloom",
      price: 1999,
      description: "Most popular: Live yoga sessions (General), Generalized diet plans, Chat with AI, Meditation sessions (Coming soon)."
    },
    flourish: {
      name: "Flourish",
      price: 4999,
      description: "Perfect for special needs: Live yoga sessions (Individual), Personalized diet plans, Chat with AI, Meditation sessions (Coming soon)."
    }
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-center">Checkout</h1>
        {selectedPlan ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold mb-2">{selectedPlan.name} Plan</h2>
              <p className="text-lg text-gray-700 mb-2">₹{selectedPlan.price} / {plan === "seed" ? "mo" : "mo or yr"}</p>
              <p className="text-gray-600 text-sm">{selectedPlan.description}</p>
            </div>
            <div className="mt-8 text-center">
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition">Proceed to Payment</button>
            </div>
          </>
        ) : (
          <div className="text-center text-red-500 font-medium">Invalid or missing plan. Please select a plan from the pricing page.</div>
        )}
      </div>
    </div>
  );
} 