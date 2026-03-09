import { useEffect } from "react";

interface UseBootConsoleCommandsProps {
  setShowAdminPanel: (v: boolean) => void;
  setMaintenanceMode: (v: boolean) => void;
  setDevModeOpen: (v: boolean) => void;
}

export const useBootConsoleCommands = ({
  setShowAdminPanel, setMaintenanceMode, setDevModeOpen,
}: UseBootConsoleCommandsProps) => {
  useEffect(() => {
    window.adminPanel = () => {
      setShowAdminPanel(true);
      console.log("%c[SYSTEM] Admin Panel Opened", "color: #00ff00; font-weight: bold");
    };
    window.maintenanceMode = () => {
      setMaintenanceMode(true);
      console.log("%c[SYSTEM] Entering Maintenance Mode...", "color: #ffff00; font-weight: bold");
    };
    window.normalMode = () => {
      setMaintenanceMode(false);
      console.log("%c[SYSTEM] Returning to Normal Mode...", "color: #00ff00; font-weight: bold");
    };
    window.devMode = () => {
      setDevModeOpen(true);
      console.log("%c[SYSTEM] Opening Developer Console...", "color: #ff00ff; font-weight: bold");
    };

    console.log("%c[URBANSHADE OS] Console Commands Available", "color: #00ffff; font-weight: bold; font-size: 14px");
    console.log("%cadminPanel() - Access admin panel (password required)", "color: #888888");
    console.log("%cmaintenanceMode() - Enter maintenance mode", "color: #888888");
    console.log("%cnormalMode() - Return to normal mode", "color: #888888");
    console.log("%cdevMode() - Open developer console", "color: #ff00ff");
    console.log("%c\nHint: Check the HTML source for hidden secrets...", "color: #ffaa00; font-style: italic");
  }, [setShowAdminPanel, setMaintenanceMode, setDevModeOpen]);
};
