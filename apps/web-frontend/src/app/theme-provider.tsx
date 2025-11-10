"use client";

import React, { useEffect } from "react";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Effect for handling system theme preference
  useEffect(() => {

    // Function to apply dark mode class based on system preference
    const applyTheme = () => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Remove the no-theme-yet class to make content visible
      document.documentElement.classList.remove("no-theme-yet");
    };

    // Apply theme initially
    applyTheme();

    // Set up listener for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme();

    // Add event listener
    mediaQuery.addEventListener("change", handleChange);

    // Clean up
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Render children while theme effects are applied via useEffect
  return <>{children}</>;
}
