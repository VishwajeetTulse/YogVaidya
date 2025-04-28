export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-lg mb-8">Choose a plan that suits you best.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Basic Plan</h2>
          <p className="text-gray-700 mb-4">$10/month</p>
          <ul className="list-disc list-inside mb-4">
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
          </ul>
          <button className="bg-blue-500 text-white py-2 px-4 rounded">
            Select
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Pro Plan</h2>
          <p className="text-gray-700 mb-4">$20/month</p>
          <ul className="list-disc list-inside mb-4">
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
          </ul>
          <button className="bg-blue-500 text-white py-2 px-4 rounded">
            Select
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Premium Plan</h2>
          <p className="text-gray-700 mb-4">$30/month</p>
          <ul className="list-disc list-inside mb-4">
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
          </ul>
          <button className="bg-blue-500 text-white py-2 px-4 rounded">
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
