import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          appearance={{
            variables: {
              colorPrimary: "#39FF14",
              colorBackground: "hsl(240 17% 8%)",
              colorInputBackground: "hsl(240 10% 15%)",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "hsl(240 5% 60%)",
              colorNeutral: "hsl(240 10% 20%)",
              borderRadius: "0.75rem",
              fontFamily: "Inter, system-ui, sans-serif",
            },
            elements: {
              card: "shadow-2xl shadow-primary/10 border border-border/40",
              headerTitle: "text-foreground",
              socialButtonsBlockButton: "border-border/50 hover:bg-muted",
            },
          }}
        />
      </div>
    </div>
  );
}
