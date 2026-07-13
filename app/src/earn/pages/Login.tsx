import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@earn/components/ui/form";
import { Input } from "@earn/components/ui/input";
import { useToast } from "@earn/hooks/use-toast";
import { useAuth } from "@earn/contexts/AuthContext";
import { Loader2, Star, Trophy, Zap } from "lucide-react";

const formSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      await login(values);
    } catch (error: any) {
      if (error?.message === 'WRONG_PORTAL') {
        toast({
          variant: "destructive",
          title: "Wrong portal",
          description: "Brand and Admin accounts log in at the Brand Portal. Redirecting you there now…",
        });
        setTimeout(() => { window.location.href = '/brands/login'; }, 1800);
        return;
      }
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.response?.data?.message || "Invalid email or password.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-grid">

      {/* ── Left panel — brand/value ── */}
      <div className="hidden md:flex flex-col justify-between gradient-bg p-12 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.06] rotate-45 translate-x-24 -translate-y-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/[0.06] rotate-[20deg] -translate-x-12 translate-y-12 pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="h-9 w-9 bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-black text-[17px]">A</span>
          </div>
          <span className="font-black text-[18px] text-white uppercase tracking-tight">AdSpot</span>
        </Link>

        {/* Value props */}
        <div className="relative z-10">
          <h2 className="text-[44px] font-black text-white leading-[0.92] tracking-[-0.04em] mb-8">
            Watch ads.<br />Earn real<br />rewards.
          </h2>
          <div className="space-y-4">
            {[
              { icon: Star,   text: "Earn points for every ad you review" },
              { icon: Trophy, text: "Climb the leaderboard & win bonuses" },
              { icon: Zap,    text: "Instant payouts from Nigeria's top brands" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-white" />
                </div>
                <p className="text-white/80 text-[14px] font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-white/30 text-[12px] font-medium">
          Trusted by MTN, Dangote, Guinness &amp; more
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 md:px-16 py-16 bg-white min-h-screen md:min-h-0">
        {/* Mobile logo */}
        <div className="md:hidden mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 gradient-bg flex items-center justify-center">
              <span className="text-white font-black text-[14px]">A</span>
            </div>
            <span className="font-black text-[16px] text-[#0f0f14] uppercase tracking-tight">AdSpot</span>
          </Link>
        </div>

        <div className="max-w-sm w-full mx-auto">
          <div className="mb-10">
            <h1 className="text-[30px] font-black tracking-[-0.03em] text-[#0f0f14] mb-2">Welcome back</h1>
            <p className="text-[14px] text-[#9ca3af] font-medium">
              New here?{" "}
              <Link href="/register" className="text-[#f97316] font-bold hover:underline">Create a free account</Link>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[12px] font-black uppercase tracking-wider text-[#0f0f14]/60">
                      Email address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        className="h-12 border-2 border-black/[0.12] focus:border-[#e91e8c] text-[15px] font-medium bg-[#fafafa] placeholder:text-[#d1d5db] transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[12px] font-black uppercase tracking-wider text-[#0f0f14]/60">
                        Password
                      </FormLabel>
                      <a href="#" className="text-[12px] font-bold text-[#f97316] hover:underline">Forgot?</a>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        className="h-12 border-2 border-black/[0.12] focus:border-[#e91e8c] text-[15px] bg-[#fafafa] placeholder:text-[#d1d5db] transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-green w-full justify-center mt-2 h-12 text-[15px] font-black disabled:opacity-60"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign in"}
              </button>
            </form>
          </Form>

          <div className="mt-8 pt-8 border-t border-black/[0.07] text-center">
            <p className="text-[12px] text-[#9ca3af] mb-2">Brand or Admin?</p>
            <a href="/brands/login"
              className="inline-block text-[13px] font-black text-[#f97316] hover:underline">
              Go to Brand Portal →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
