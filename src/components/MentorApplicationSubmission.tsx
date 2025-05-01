import React from "react";
import { Button } from "@/components/ui/button";

interface MentorApplicationSubmissionProps {
  application: any;
  onDelete: () => void;
  deleteLoading: boolean;
  deleteError: string | null;
}

const MentorApplicationSubmission: React.FC<MentorApplicationSubmissionProps> = ({ application, onDelete, deleteLoading, deleteError }) => {
  if (!application) return <div>No application found.</div>;
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 shadow-lg border border-gray-100 mt-10 mb-10 text-center">
      <h2 className="text-2xl font-bold mb-6 text-green-700">Application Submitted!</h2>
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-left">
        <div>
          <div className="font-semibold text-gray-700">Name:</div>
          <div className="text-gray-900 break-words">{application.name}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Email:</div>
          <div className="text-gray-900 break-words">{application.email}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Phone:</div>
          <div className="text-gray-900 break-words">{application.phone}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Experience:</div>
          <div className="text-gray-900 break-words whitespace-pre-line">{application.experience}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Expertise:</div>
          <div className="text-gray-900 break-words">{application.expertise}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Certifications:</div>
          <div className="text-gray-900 break-words">{application.certifications}</div>
        </div>
        {application.powUrl && (
          <div className="md:col-span-2">
            <div className="font-semibold text-gray-700">Proof of Work:</div>
            <div className="text-gray-900 break-words">{application.powUrl}</div>
          </div>
        )}
      </div>
      <Button onClick={onDelete} variant="destructive" disabled={deleteLoading}>
        {deleteLoading ? "Deleting..." : "Delete Application"}
      </Button>
      {deleteError && <p className="text-red-500 text-sm mt-2">{deleteError}</p>}
    </div>
  );
};

export default MentorApplicationSubmission;
