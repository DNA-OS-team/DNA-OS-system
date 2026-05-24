"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCustomerMe, type CustomerMe } from "./customer-order-api";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; me: CustomerMe }
  | { status: "unauthenticated" };

export function useCustomerAuth(redirectPath?: string): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    getCustomerMe()
      .then((me) => {
        if (mounted) setState({ status: "authenticated", me });
      })
      .catch(() => {
        if (mounted) {
          setState({ status: "unauthenticated" });
          const next = redirectPath ?? (typeof window !== "undefined" ? window.location.pathname : "/customer/orders");
          router.replace(`/line/connect?next=${encodeURIComponent(next)}`);
        }
      });
    return () => { mounted = false; };
  }, [router, redirectPath]);

  return state;
}
