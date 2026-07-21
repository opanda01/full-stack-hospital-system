import { createContext, useContext } from "react";

/** RoleLayoutRoute / PanelShell içindeyken LegacyShell içerik-only moduna geçer. */
export const InPanelShellContext = createContext(false);

export function useInPanelShell() {
  return useContext(InPanelShellContext);
}
