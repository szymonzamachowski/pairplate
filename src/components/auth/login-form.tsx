"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/actions/auth";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result =
        mode === "login"
          ? await signIn(email, password)
          : await signUp(email, password);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="pp-gradient-bg mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center text-center">
        <BrandLogo variant="full" className="mb-6 h-10" priority />
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Kalorie i posiłki dla dwojga — w jednej eleganckiej przestrzeni
        </p>
      </div>

      <div className="pp-card p-6">
        <h2 className="mb-5 text-lg font-medium">
          {mode === "login" ? "Zaloguj się" : "Utwórz konto"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pp-input mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pp-input mt-1.5"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="pp-btn-primary w-full" disabled={isPending}>
            {mode === "login" ? "Zaloguj" : "Załóż konto"}
          </Button>
        </form>

        <Button
          variant="link"
          className="mt-4 w-full text-primary"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? "Nie masz konta? Zarejestruj się"
            : "Masz konto? Zaloguj się"}
        </Button>
      </div>
    </div>
  );
}
