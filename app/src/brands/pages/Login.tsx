import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "@brands/contexts/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@brands/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@brands/components/ui/form";
import { Input } from "@brands/components/ui/input";
import { useToast } from "@brands/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login: setAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuth(data.token);
          if (data.user.role === "admin" || data.user.role === "super_admin") {
            setLocation("/admin/dashboard");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.data?.message || "Invalid credentials",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — landing page warm theme */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #fff7f0 0%, #ffeedd 100%)" }}
      >
        {/* Background glow blobs — matches landing page */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <a href="/" className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-black text-xl leading-none">A</span>
          </div>
          <span className="text-foreground font-bold text-2xl tracking-tight">AdSpot</span>
        </a>

        {/* Hero copy */}
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Nigeria's #1 Ad Review Platform</p>
          <h2 className="text-foreground font-black text-5xl leading-tight mb-5">
            Launch.<br />
            <span className="text-primary">Measure.</span><br />
            Win.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-sm">
            Get real feedback from verified Nigerian reviewers and track every impression with live analytics.
          </p>
          <div className="space-y-4">
            {[
              "300+ active brand partners",
              "Real-time engagement analytics",
              "AI-powered campaign summaries",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-foreground/80 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-foreground/30 text-xs relative z-10">© 2025 AdSpot. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <a href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-lg leading-none">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight">AdSpot</span>
          </a>

          <h1 className="text-3xl font-bold text-foreground mb-1">Welcome</h1>
          <p className="text-muted-foreground mb-8">Sign in to your brand or admin account</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@company.com"
                        className="h-11"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="h-11"
                        {...field}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 font-bold text-base"
                disabled={loginMutation.isPending}
                data-testid="btn-submit-login"
              >
                {loginMutation.isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register here
            </Link>
          </p>

          <p className="text-sm text-muted-foreground text-center mt-3">
            <a href="/" className="text-muted-foreground hover:text-foreground hover:underline text-xs">
              ← Back to main site
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
