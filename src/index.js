import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import './App.scss'
import ScrollToTop from "./ScrollToTop";

// Polyfills
import { Buffer } from 'buffer';
import process from 'process';

if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = Buffer;
  window.process = process;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.Fragment>
        <BrowserRouter>
        <ScrollToTop />
            <App />
        </BrowserRouter>
    </React.Fragment>
);

