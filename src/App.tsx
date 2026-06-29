// src/App.tsx
import { Suspense } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import routes from "./router/config";

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}