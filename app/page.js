import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Brain, Code2, Monitor, Mic, Star, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">PrepAI</span>
        </div>
        <Link href="/auth">
          <Button>Get Started</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Mic className="h-4 w-4" /> AI-Powered Voice Interview Practice
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 max-w-3xl leading-tight">
          Ace Your Next Interview with <span className="text-blue-600">AI Practice</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mt-6">
          Practice System Design, DSA, Development & Behavioral interviews with an AI voice interviewer. Get instant feedback and improve your skills.
        </p>
        <div className="flex gap-4 mt-10">
          <Link href="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Practicing Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Practice Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'System Design', icon: Monitor, desc: 'Scalability, architecture & distributed systems', color: 'bg-purple-100 text-purple-700' },
            { title: 'DSA', icon: Brain, desc: 'Arrays, trees, graphs & dynamic programming', color: 'bg-green-100 text-green-700' },
            { title: 'Development', icon: Code2, desc: 'Frontend, backend & full-stack concepts', color: 'bg-blue-100 text-blue-700' },
            { title: 'Behavioral', icon: Star, desc: 'Teamwork, leadership & communication', color: 'bg-orange-100 text-orange-700' },
          ].map((cat) => (
            <div key={cat.title} className="bg-white rounded-xl p-6 border hover:shadow-lg transition-all cursor-pointer">
              <div className={`w-12 h-12 rounded-lg ${cat.color} flex items-center justify-center mb-4`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{cat.title}</h3>
              <p className="text-gray-500 text-sm">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose Category', desc: 'Pick from System Design, DSA, Development or Behavioral' },
              { step: '2', title: 'AI Interviews You', desc: 'Our AI voice agent asks real interview questions and listens to your answers' },
              { step: '3', title: 'Get Feedback', desc: 'Receive detailed scores, strengths & improvement areas instantly' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="px-8 py-16 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Supported Languages</h2>
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { name: 'Python', emoji: '🐍' },
            { name: 'JavaScript', emoji: '⚡' },
            { name: 'C++', emoji: '⚙️' },
            { name: 'Java', emoji: '☕' },
          ].map((lang) => (
            <div key={lang.name} className="bg-white border rounded-xl px-8 py-4 flex items-center gap-3 hover:shadow-md transition">
              <span className="text-2xl">{lang.emoji}</span>
              <span className="font-semibold text-lg">{lang.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="h-5 w-5 text-blue-400" />
          <span className="text-white font-bold">PrepAI</span>
        </div>
        <p className="text-sm">AI-Powered Interview Preparation Platform</p>
      </footer>
    </div>
  );
}
