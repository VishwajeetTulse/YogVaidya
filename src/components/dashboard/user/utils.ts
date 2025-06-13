export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "bg-gradient-to-r from-[#76d2fa] to-[#5a9be9] text-white";
    case "INACTIVE":
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    case "CANCELLED":
      return "bg-gradient-to-r from-red-400 to-red-500 text-white";
    case "EXPIRED":
      return "bg-gradient-to-r from-orange-400 to-orange-500 text-white";
    case "PENDING":
      return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
    default:
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
  }
};
