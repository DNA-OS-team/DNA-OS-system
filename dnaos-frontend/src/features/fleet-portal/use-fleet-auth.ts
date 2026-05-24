"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortalMe, type PortalMe } from "./fleet-api";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; me: PortalMe }
  | { status: "unauthenticated" };

export function useFleetAuth(redirectPath?: string): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    getPortalMe()
      .then((me) => { if (mounted) setState({ status: "authenticated", me }); })
      .catch(() => {
        if (mounted) {
          setState({ status: "unauthenticated" });
          const next = redirectPath ?? "/fleet/jobs";
          router.replace(`/line/connect?channel=fleet&next=${encodeURIComponent(next)}`);
        }
      });
    return () => { mounted = false; };
  }, [router, redirectPath]);

  return state;
}
