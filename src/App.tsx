import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { OSToastContainer } from "@/components/shared/OSToast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Docs from "./pages/Docs";
import DefDevMain from "./components/defdev/DefDevMain";
import GettingStarted from "./pages/docs/GettingStarted";
import Applications from "./pages/docs/Applications";
import Facility from "./pages/docs/Facility";
import TerminalGuide from "./pages/docs/TerminalGuide";
import AdminPanelDocs from "./pages/docs/AdminPanel";
import Advanced from "./pages/docs/Advanced";
import Shortcuts from "./pages/docs/Shortcuts";
import Troubleshooting from "./pages/docs/Troubleshooting";
import DefDevDocs from "./pages/docs/DefDev";
import DefDevIndex from "./pages/docs/defdev/Index";
import DefDevSetup from "./pages/docs/defdev/Setup";
import DefDevConsole from "./pages/docs/defdev/Console";
import DefDevActions from "./pages/docs/defdev/Actions";
import DefDevStorage from "./pages/docs/defdev/Storage";
import DefDevTerminal from "./pages/docs/defdev/Terminal";
import DefDevAdmin from "./pages/docs/defdev/Admin";
import DefDevBugchecks from "./pages/docs/defdev/Bugchecks";
import DefDevAPI from "./pages/docs/defdev/API";
import DefDevDiagnostics from "./pages/docs/defdev/Diagnostics";
import UURDocs from "./pages/docs/UUR";
import Features from "./pages/docs/Features";
import Safety from "./pages/docs/Safety";
import Moderation from "./pages/docs/Moderation";
import EndOfLife from "./pages/docs/EndOfLife";

// Developer docs
import DevDocsIndex from "./pages/docs/dev/Index";
import DevArchitecture from "./pages/docs/dev/Architecture";
import DevTheming from "./pages/docs/dev/Theming";
import DevApps from "./pages/docs/dev/Apps";
import DevTerminal from "./pages/docs/dev/Terminal";
import DevSystemBus from "./pages/docs/dev/SystemBus";
import DevUUR from "./pages/docs/dev/UUR";
import DevContributing from "./pages/docs/dev/Contributing";

// Safety sub-pages
import Badges from "./pages/docs/safety/Badges";
import AccountSafety from "./pages/docs/safety/AccountSafety";
import Reporting from "./pages/docs/safety/Reporting";

// Moderation sub-pages
import ModerationOverview from "./pages/docs/moderation/Overview";
import NaviMonitor from "./pages/docs/moderation/NaviMonitor";
import ModerationActions from "./pages/docs/moderation/Actions";
import Statistics from "./pages/docs/moderation/Statistics";

import NotFound from "./pages/NotFound";
import ModerationPanel from "./pages/ModerationPanel";
import StatusPage from "./pages/Status";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Team from "./pages/Team";
import TeamGit from "./pages/TeamGit";
import GitRedirect from "./pages/GitRedirect";
import Support from "./pages/Support";
import Report from "./pages/Report";

// Account Manager pages
import AccManageLayout from "./pages/acc-manage/Layout";
import AccManageGeneral from "./pages/acc-manage/General";
import AccManageData from "./pages/acc-manage/Data";
import AccManageSecurity from "./pages/acc-manage/Security";
import AccManageDevices from "./pages/acc-manage/Devices";
import AccManageDanger from "./pages/acc-manage/Danger";

const queryClient = new QueryClient();

// ========== SITE BLOCK TOGGLE ==========
// Set to false to restore the site
const SITE_BLOCKED = true;
const BLOCK_MESSAGE = `Hello people.

We are aware of the current drama about Pressure and Zeal
Due to the fact, that the whole fucking thing is inspired from that one game, and we do not want to associate ourselves with it, we:

are completely locking Urbanshade OS
In progress of a rebrand from the Urbanshade Team

This is all extremely sudden. Please do not harass anyone, and please understand.

Now that our team can be associated with a dev, that has SAed someone, i feel extremely disgusted of myself, this OS and the entire game.

I stand with the developers and Gianni - this is completely unacceptable.

I hope you understand.

If you really, REALLY still want to use this, fork the github page, go into app.tsx and set SITE_BLOCKED to false.

- Aswd`;
// ========================================

const BlockPage = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
    }}
  >
    <p
      style={{
        color: "#fff",
        fontFamily: "monospace",
        fontSize: "1.1rem",
        textAlign: "left",
        padding: "2rem",
        whiteSpace: "pre-wrap",
        maxWidth: "600px",
        lineHeight: "1.7",
      }}
    >
      {BLOCK_MESSAGE}
    </p>
  </div>
);

const App = () => {
  if (SITE_BLOCKED) return <BlockPage />;

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Sonner />
        <OSToastContainer />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/def-dev" element={<DefDevMain />} />
            <Route path="/docs/getting-started" element={<GettingStarted />} />
            <Route path="/docs/applications" element={<Applications />} />
            <Route path="/docs/facility" element={<Facility />} />
            <Route path="/docs/terminal" element={<TerminalGuide />} />
            <Route path="/docs/admin-panel" element={<AdminPanelDocs />} />
            <Route path="/docs/advanced" element={<Advanced />} />
            <Route path="/docs/shortcuts" element={<Shortcuts />} />
            <Route path="/docs/troubleshooting" element={<Troubleshooting />} />
            <Route path="/docs/def-dev" element={<DefDevIndex />} />
            <Route path="/docs/def-dev/setup" element={<DefDevSetup />} />
            <Route path="/docs/def-dev/console" element={<DefDevConsole />} />
            <Route path="/docs/def-dev/actions" element={<DefDevActions />} />
            <Route path="/docs/def-dev/storage" element={<DefDevStorage />} />
            <Route path="/docs/def-dev/terminal" element={<DefDevTerminal />} />
            <Route path="/docs/def-dev/admin" element={<DefDevAdmin />} />
            <Route path="/docs/def-dev/bugchecks" element={<DefDevBugchecks />} />
            <Route path="/docs/def-dev/api" element={<DefDevAPI />} />
            <Route path="/docs/def-dev/diagnostics" element={<DefDevDiagnostics />} />
            <Route path="/docs/uur" element={<UURDocs />} />
            <Route path="/docs/features" element={<Features />} />
            <Route path="/docs/end-of-life" element={<EndOfLife />} />

            {/* Safety docs - hub and sub-pages */}
            <Route path="/docs/safety" element={<Safety />} />
            <Route path="/docs/safety/badges" element={<Badges />} />
            <Route path="/docs/safety/account" element={<AccountSafety />} />
            <Route path="/docs/safety/reporting" element={<Reporting />} />

            {/* Moderation docs - hub and sub-pages */}
            <Route path="/docs/moderation" element={<Moderation />} />
            <Route path="/docs/moderation/overview" element={<ModerationOverview />} />
            <Route path="/docs/moderation/navi" element={<NaviMonitor />} />
            <Route path="/docs/moderation/actions" element={<ModerationActions />} />
            <Route path="/docs/moderation/stats" element={<Statistics />} />

            {/* Developer docs */}
            <Route path="/docs/dev" element={<DevDocsIndex />} />
            <Route path="/docs/dev/architecture" element={<DevArchitecture />} />
            <Route path="/docs/dev/theming" element={<DevTheming />} />
            <Route path="/docs/dev/apps" element={<DevApps />} />
            <Route path="/docs/dev/terminal" element={<DevTerminal />} />
            <Route path="/docs/dev/system-bus" element={<DevSystemBus />} />
            <Route path="/docs/dev/uur" element={<DevUUR />} />
            <Route path="/docs/dev/contributing" element={<DevContributing />} />

            {/* Account Manager - nested routes */}
            <Route path="/acc-manage" element={<AccManageLayout />}>
              <Route index element={<Navigate to="/acc-manage/general" replace />} />
              <Route path="general" element={<AccManageGeneral />} />
              <Route path="data" element={<AccManageData />} />
              <Route path="security" element={<AccManageSecurity />} />
              <Route path="devices" element={<AccManageDevices />} />
              <Route path="danger" element={<AccManageDanger />} />
            </Route>

            {/* Moderation Panel - Admin only */}
            <Route path="/moderation" element={<ModerationPanel />} />

            {/* Status Page */}
            <Route path="/status" element={<StatusPage />} />

            {/* Legal Pages */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/git" element={<TeamGit />} />
            <Route path="/git" element={<GitRedirect />} />
            <Route path="/support" element={<Support />} />
            <Route path="/report" element={<Report />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
