import { PersonaSelectionClient } from "@/components/auth/PersonaSelectionClient";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default async function PersonaOnboardingPage() {
  return (
    <ProtectedRoute mode="persona-missing">
      <PersonaSelectionClient />
    </ProtectedRoute>
  );
}
