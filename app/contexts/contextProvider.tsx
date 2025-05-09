import { GlobalGameStateProvider } from "@/contexts/globalGameState";
import { GlobalUserProvider } from "@/contexts/globalUser";
import { GlobalUserAttributesProvider } from "@/contexts/globalUserAttributes";

const ContextProvider = ({ children }: { children: React.ReactNode }) => (
  <GlobalGameStateProvider>
    <GlobalUserAttributesProvider>
      <GlobalUserProvider>{children}</GlobalUserProvider>
    </GlobalUserAttributesProvider>
  </GlobalGameStateProvider>
);

export default ContextProvider;
