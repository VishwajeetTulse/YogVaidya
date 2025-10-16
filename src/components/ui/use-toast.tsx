/**
 * Simple toast hook - in a real application this would use a UI library's toast system
 */
export function useToast() {
  return {
    toast: ({
      title: _title,
      description: _description,
      variant: _variant,
    }: {
      title: string;
      description: string;
      variant?: "default" | "destructive";
    }) => {},
  };
}
