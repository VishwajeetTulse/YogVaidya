/**
 * Simple toast hook - in a real application this would use a UI library's toast system
 */
export function useToast() {
  return {
    toast: ({ title, description, variant }: { title: string; description: string; variant?: "default" | "destructive" }) => {
      console.log(`Toast: ${title} - ${description} (${variant || 'default'})`)
    }
  }
}
