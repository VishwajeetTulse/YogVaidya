'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { RenewalResult } from '@/lib/types';

export function SimpleRenewalDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<RenewalResult | null>(null);

  const runRenewal = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/cron/subscription-renewal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'simple_secret_123'}`
        }
      });
      const data: RenewalResult = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Renewal failed:', error);
      setResults({ success: false, error: 'Failed to run renewal' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manual Subscription Renewal</h2>
      
      <Button 
        onClick={runRenewal} 
        disabled={isProcessing}
        className="w-full mb-4"
      >
        {isProcessing ? 'Processing...' : 'Run Renewal Process'}
      </Button>

      {results && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">Results:</h3>
          <p>Users processed: {results.renewed || 0}</p>
          <p>Status: {results.success ? 'Success' : 'Failed'}</p>
          {results.message && <p>Message: {results.message}</p>}
          {results.error && <p className="text-red-600">Error: {results.error}</p>}
        </div>
      )}
    </div>
  );
}
