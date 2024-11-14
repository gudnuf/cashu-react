import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CashuProvider, setupCashu } from "../lib";

setupCashu();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CashuProvider>
      <App />
    </CashuProvider>
  </StrictMode>
);
