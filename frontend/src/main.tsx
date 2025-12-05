import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./global.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeProvider"; 

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>            
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
