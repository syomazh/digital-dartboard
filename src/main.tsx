import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/barlow-condensed/latin-500.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import App from "./App";
import "./styles.css";

// Canvas targets use the same local fonts as the interface.
void Promise.all([
  document.fonts.load('500 91px "Barlow Condensed"'),
  document.fonts.load('600 104px "Barlow Condensed"'),
]).finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
