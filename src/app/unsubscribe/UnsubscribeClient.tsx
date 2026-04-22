"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";

type State =
  | { status: "loading" }
  | { status: "success"; email: string | null }
  | { status: "error"; message: string };

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

export function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>({ status: "loading" });

  const unsubscribe = trpc.email.unsubscribe.useMutation();

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        message: "This unsubscribe link is missing its token. It may be malformed.",
      });
      return;
    }

    let cancelled = false;
    unsubscribe
      .mutateAsync({ token })
      .then((result) => {
        if (cancelled) return;
        setState({ status: "success", email: result.email ?? null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err.message || "We couldn't process your unsubscribe request.",
        });
      });

    return () => {
      cancelled = true;
    };
    // We only want to run this once per token. Re-running on every render would
    // re-submit the mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {state.status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
            <h1 className="text-xl font-semibold mb-2">Unsubscribing…</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Give us a moment while we update your preferences.
            </p>
          </>
        )}

        {state.status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">You&apos;re unsubscribed</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {maskEmail(state.email)
                ? `We won't email ${maskEmail(state.email)} anymore.`
                : "You won't receive further email notifications from us."}
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Transactional emails (password reset, login alerts) may still be sent for account security.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block text-sm text-indigo-600 hover:text-indigo-500 underline"
            >
              Manage email preferences
            </Link>
          </>
        )}

        {state.status === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Unsubscribe failed</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {state.message}
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block text-sm text-indigo-600 hover:text-indigo-500 underline"
            >
              Update preferences in settings
            </Link>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        &copy; {new Date().getFullYear()} RepurposeAI
      </p>
    </div>
  );
}
