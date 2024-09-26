import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import VConsole from "vconsole";

// const vConsole = new VConsole();

const root = document.getElementById("root") as HTMLDivElement;
ReactDOM.createRoot(root).render(<App />);
