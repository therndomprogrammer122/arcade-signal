"use client";

import { useEffect, useState } from "react";

export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/csrf")
      .then((res) => res.json())
      .then((data) => setToken(data.csrfToken))
      .catch(() => setToken(null));
  }, []);

  return token;
}
