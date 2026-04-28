'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Login failed');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-4">
      <Card className="shadow-xl border-border/60">
        <CardHeader className="space-y-6 pb-4 pt-8 text-center">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-md ring-2 ring-border/30">
            <Image
              src="/assets/icon.webp"
              alt="Placement"
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to your Placement Dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8 px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <Separator className="my-5" />

          <p className="text-center text-xs text-muted-foreground">
            Contact your administrator if you need access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
