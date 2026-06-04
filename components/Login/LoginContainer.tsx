"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/contexts/DemoProvider";
import toast from "react-hot-toast";
import AuthCard from "./AuthCard";
import AuthCanvas from "./AuthCanvas";

export default function LoginContainer() {
  const router = useRouter();
  const { isLoggedIn, isOnboarded, login, isLoaded } = useDemo();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoaded) return;
    if (isLoggedIn && isOnboarded) {
      router.replace("/");
    } else if (isLoggedIn && !isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isLoggedIn, isOnboarded, isLoaded, router]);

  const handleComplete = (email: string) => {
    login(email || "alex@novapay.io");
    toast.success("Successfully authenticated");
    router.push("/onboarding");
  };

  return (
    <AuthCanvas>
      <AuthCard onComplete={handleComplete} />
    </AuthCanvas>
  );
}
