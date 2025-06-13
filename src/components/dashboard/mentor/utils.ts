export const formatDate = (date: Date | null | undefined) => {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
