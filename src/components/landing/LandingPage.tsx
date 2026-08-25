import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar, Repeat, Bell, Settings2, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      title: "Smart Habit Tracking",
      description: "Build and maintain positive routines with our intuitive habit visualization and streak counters.",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: "Event Management",
      description: "Seamlessly integrate one-off events and meetings alongside your daily habits for a complete overview.",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      title: "Daily & Recurring Schedules",
      description: "Set up repeating tasks effortlessly. Whether it's daily, weekly, or custom intervals, Habi adapts to your rhythm.",
      icon: <Repeat className="w-5 h-5" />,
    },
    {
      title: "Intelligent Notifications",
      description: "Never miss a beat. Get timely, customizable alerts for upcoming events and scheduled habits.",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      title: "Deeply Personalized",
      description: "Tailor your dashboard, notification preferences, and schedule structures exactly to how your brain works.",
      icon: <Settings2 className="w-5 h-5" />,
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <header className="px-6 lg:px-14 h-16 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-lg">Habi</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="rounded-full">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 flex flex-col items-center justify-center text-center px-4">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            The minimal way to manage your time
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-4xl mb-6 text-foreground animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100 fill-mode-both">
            Master your schedule. <br className="hidden sm:inline" />
            <span className="text-muted-foreground">Own your habits.</span>
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
            Habi is the minimalist schedule tracker designed to help you manage events, daily routines, and recurring schedules efficiently—all personalized to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300 fill-mode-both">
            <Link href="/auth/signup">
              <Button size="lg" className="rounded-full gap-2 px-8 h-12">
                Start tracking for free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12">
                Explore features
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 bg-muted/20 border-t border-border/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need. Nothing you don&apos;t.</h2>
              <p className="max-w-[600px] text-muted-foreground">
                Built with a focus on simplicity and efficiency, Habi provides powerful tools without the clutter.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, i) => (
                <Card key={i} className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 group">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-24 px-4">
          <div className="max-w-4xl mx-auto rounded-3xl bg-primary text-primary-foreground p-12 text-center flex flex-col items-center shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to take control of your time?</h2>
            <p className="max-w-[500px] text-primary-foreground/80 mb-8 text-lg">
              Join thousands of users who have transformed their daily routines with Habi.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 font-medium hover:scale-105 transition-transform">
                Create your workspace
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40 bg-background flex flex-col sm:flex-row items-center justify-between px-6 lg:px-14">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Habi. All rights reserved.
        </p>
        <div className="flex gap-6 mt-4 sm:mt-0 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
