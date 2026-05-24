"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupplierMe } from "./supplier-api";
import type { PortalMe } from "@/features/fleet-portal/fleet-api";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; me: PortalMe }
  | { status: "unauthenticated" };

export function useSupplierAuth(redirectPath?: string): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    getSupplierMe()
      .then((me) => { if (mounted) setState({ status: "authenticated", me }); })
      .catch(() => {
        if (mounted) {
          setState({ status: "unauthenticated" });
          const next = redirectPath ?? "/supplier/orders";
          router.replace(`/line/connect?channel=supplier&next=${encodeURIComponent(next)}`);
        }
      });
    return () => { mounted = false; };
  }, [router, redirectPath]);

  return state;
}
