import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, CheckSquare, MessageCircle, Trophy, Shield } from "lucide-react";
import { MetaTags } from "@/components/MetaTags";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <MetaTags
        title="SmartZim — ZIMSEC & Cambridge Exam Prep | AI Tutor & Past Papers"
        description="Prepare for ZIMSEC and Cambridge exams with SmartZim. Access thousands of past papers, AI-powered tutoring (ZimTutor), mock exams, and structured study planners. Join students across Zimbabwe today."
        canonical="/"
      />
      <header className="px-6 py-4 flex items-center justify-between bg-card border-b">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          SmartZim
        </div>
        <div className="flex items-center gap-4">
          <Link href="/ministry">
            <span className="hidden sm:inline text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">Ministry Announcements</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-20 md:py-32 text-center max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
          >
            ZIMSEC &amp; Cambridge <span className="text-primary">Exam Prep for Zimbabwean Students</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Prepare for ZIMSEC and Cambridge with confidence. Access past papers, intelligent tutoring, and a structured study planner right in your pocket.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Start Learning Now
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-primary text-primary hover:bg-primary/5">
                I already have an account
              </Button>
            </Link>
          </motion.div>
        </section>

        <section className="bg-white py-20 border-y">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16">Everything you need to excel</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-background rounded-2xl border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Past Papers Library</h3>
                <p className="text-muted-foreground">Access a massive collection of ZIMSEC and Cambridge past papers with marking schemes.</p>
              </div>
              <div className="p-6 bg-background rounded-2xl border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">ZimTutor AI</h3>
                <p className="text-muted-foreground">Stuck on a concept? Chat with our intelligent tutor tailored to the Zimbabwean curriculum.</p>
              </div>
              <div className="p-6 bg-background rounded-2xl border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-accent/20 text-accent-foreground rounded-xl flex items-center justify-center mb-4">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mock Exams</h3>
                <p className="text-muted-foreground">Test your knowledge under timed conditions and track your progress over time.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-primary/10 text-primary rounded-full mb-6">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold mb-6">Built for Success</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of students and teachers across Zimbabwe taking their education to the next level.
          </p>
          <div className="p-6 bg-card rounded-2xl border max-w-sm mx-auto shadow-md">
            <div className="text-4xl font-black text-primary mb-2">$2<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
            <p className="text-sm text-muted-foreground mb-6">Plus a one-time $4 registration fee.</p>
            <Link href="/register">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 border-t bg-card text-center text-muted-foreground text-sm space-y-3">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/ministry"><span className="hover:text-primary underline">Ministry Announcements</span></Link>
          <span aria-hidden>·</span>
          <Link href="/privacy"><span className="hover:text-primary underline">Privacy Policy</span></Link>
          <span aria-hidden>·</span>
          <Link href="/terms"><span className="hover:text-primary underline">Terms of Service</span></Link>
        </div>
        <div>SmartZim — Powered by Keith Kungwara · © 2025</div>
      </footer>
    </div>
  );
}
