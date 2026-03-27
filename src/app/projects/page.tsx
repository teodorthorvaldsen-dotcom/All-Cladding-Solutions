"use client";

import { useEffect } from "react";

/** Legacy /projects — redirect to About (gallery anchor). */
export default function ProjectsIndexRedirect() {
  useEffect(() => {
    window.location.replace("/about#our-work");
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center text-[15px] text-gray-500">
      Redirecting to About…
    </div>
  );
}
