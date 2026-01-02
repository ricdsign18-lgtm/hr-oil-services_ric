// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider.jsx";
import { ProjectProvider } from "./contexts/ProjectContext.jsx";
import { CurrencyProvider } from "./contexts/CurrencyContext.jsx";
import { BudgetProvider } from "./contexts/BudgetContext.jsx";
import { ValuationProvider } from "./contexts/ValuationContext.jsx";
//import { PlanificacionProvider } from "./contexts/PlanningContext.jsx";
import { OperacionesProvider } from "./contexts/OperacionesContext.jsx";
import { PersonalProvider } from "./contexts/PersonalContext.jsx";
import { UiProvider } from "./contexts/UiContext.jsx";
import { IncomeProvider } from "./contexts/IncomeContext.jsx";
import { PlanningProvider } from "./contexts/PlanningContext.jsx";
import { ExecutionProvider } from "./contexts/ExecutionContext";

import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UiProvider>
          <ProjectProvider>
            <NotificationProvider>
              <CurrencyProvider>
                <BudgetProvider>
                  <IncomeProvider>
                    <ValuationProvider>
                      <PlanningProvider>
                        <ExecutionProvider>
                          <PersonalProvider>
                            <OperacionesProvider>
                              <App />
                            </OperacionesProvider>
                          </PersonalProvider>
                        </ExecutionProvider>
                      </PlanningProvider>
                    </ValuationProvider>
                  </IncomeProvider>
                </BudgetProvider>
              </CurrencyProvider>
            </NotificationProvider>
          </ProjectProvider>
        </UiProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
