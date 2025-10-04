import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Calendar, CreditCard } from "lucide-react";
import { type UserDetails } from "@/lib/userDetails";

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  userDetails: UserDetails;
}

export const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  userDetails,
}) => {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Cancel Subscription
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to cancel your subscription?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">What happens when you cancel:</h4>
            <ul className="space-y-2 text-sm text-amber-700">
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Your subscription will remain active until{" "}
                  <strong>{formatDate(userDetails.nextBillingDate)}</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You will continue to have full access to all features until then</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>No further charges will be made</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You cannot upgrade or change plans during this period</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Current Plan Details:</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>
                <strong>Plan:</strong> {userDetails.subscriptionPlan || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {userDetails.subscriptionStatus || "N/A"}
              </p>
              <p>
                <strong>Next Billing Date:</strong> {formatDate(userDetails.nextBillingDate)}
              </p>
              {userDetails.paymentAmount && (
                <p>
                  <strong>Amount:</strong> ₹{userDetails.paymentAmount}/{userDetails.billingPeriod}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            Keep Subscription
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading} className="flex-1">
            {isLoading ? "Cancelling..." : "Yes, Cancel Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
