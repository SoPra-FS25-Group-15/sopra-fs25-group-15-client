import { GlobalUserProvider } from "./globalUser";
import { GlobalUserAttributesProvider } from "./globalUserAttributes";

const ContextProvider = ({ children }: { children: React.ReactNode }) => (
  <GlobalUserAttributesProvider>
    <GlobalUserProvider>{children}</GlobalUserProvider>
  </GlobalUserAttributesProvider>
);

export default ContextProvider;
