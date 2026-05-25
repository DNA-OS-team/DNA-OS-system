"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type LiffState =
  | { status: "loading" }
  | { status: "ready"; displayName: string; pictureUrl: string | null }
  | { status: "error"; message: string };

type LiffModule = typeof import("@line/liff").default;

// Promise singleton — safe against React StrictMode double-invoke
let liffInitPromise: Promise<LiffModule> | null = null;

function initLiff(liffId: string): Promise<LiffModule> {
  if (!liffInitPromise) {
    liffInitPromise = import("@line/liff").then(async (m) => {
      await m.default.init({ liffId });
      return m.default;
    });
  }
  return liffInitPromise;
}

export function useLiff(): LiffState {
  const [state, setState] = useState<LiffState>({ status: "loading" });

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setState({ status: "error", message: "LIFF ID ยังไม่ได้ตั้งค่า" });
      return;
    }

    async function init() {
      try {
        const liff = await initLiff(liffId!);

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const accessToken = liff.getAccessToken();
        if (!accessToken) throw new Error("No access token");

        await apiFetch("/liff/auth", {
          method: "POST",
          body: JSON.stringify({ accessToken }),
        });

        const profile = await liff.getProfile();
        setState({
          status: "ready",
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl ?? null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
        // If code already used, reset and retry login
        if (msg.includes("invalid authorization code") || msg.includes("invalid_code")) {
          liffInitPromise = null;
          setState({ status: "error", message: "กรุณา refresh หน้าใหม่" });
        } else {
          setState({ status: "error", message: msg });
        }
      }
    }

    init();
  }, []);

  return state;
}
