"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Welcome from "../Common/Welcome";
import { useDemo } from "@/contexts/DemoProvider";
import { useAuth } from "@/services/auth/context";
import toast from "react-hot-toast";

export default function LoginContainer() {
  const router = useRouter();
  const { isLoggedIn, isOnboarded, login, isLoaded } = useDemo();
  const { isAuthenticated, user } = useAuth();
  const [authenticating, setAuthenticating] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoaded) return;
    if (isLoggedIn && isOnboarded) {
      router.replace("/");
    } else if (isLoggedIn && !isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isLoggedIn, isOnboarded, isLoaded, router]);

  const handleGoogleLogin = () => {
    setAuthenticating(true);
    // Simulate Google OAuth delay
    setTimeout(() => {
      login("alex@novapay.io");
      toast.success("Successfully authenticated");
      router.push("/onboarding");
    }, 1500);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row w-full h-full p-3 md:p-5 bg-background overflow-hidden">
      <div className="hidden lg:block lg:w-1/2 h-full">
        <Welcome />
      </div>

      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 h-full px-4 md:px-8 lg:px-20 xl:px-50 relative">
        <div className="flex flex-col w-full max-w-md items-center justify-center mb-8 md:mb-10">
          <img src="/logo/qash-icon.svg" alt="logo" className="w-12 md:w-15" />
          <p className="font-barlow font-medium text-[24px] md:text-[32px] text-text-primary text-center w-full">
            Get started now
          </p>
          <p className="font-barlow font-medium text-[14px] md:text-[16px] text-text-secondary text-center w-full">
            Welcome to Qash - Let get started
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={authenticating}
          className="w-full max-w-md flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-primary-divider bg-background hover:bg-app-background transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {authenticating ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="var(--primary-divider)" strokeWidth="2.5" />
                <path d="M18 10a8 8 0 0 0-8-8" stroke="var(--primary-blue)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-text-primary font-medium">Signing in...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-text-primary font-medium">Continue with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
