import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, Brain, Code2, Monitor, Mic, Star, ArrowRight, Play, CheckCircle2, Sparkles, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-200 selection:text-blue-900 font-sans overflow-hidden relative">
      {/* Premium Decorative Background Elements */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_200px,#d5efff,transparent)]"></div>
      </div>

      {/* Navbar - Glassmorphic */}
      <nav className="fixed w-full top-0 z-50 py-4 px-6 md:px-12 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md shadow-blue-200">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">PrepAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth?mode=signin" className="hidden md:block text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link href="/auth?mode=signup">
              <Button className="rounded-xl px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all shadow-md active:scale-95">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 lg:pt-48 lg:pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 bg-white border border-blue-100 text-blue-700 px-5 py-2.5 rounded-full text-sm font-bold mb-8 shadow-sm shadow-blue-50/50 animate-fade-in-up">
          <Sparkles className="h-4 w-4 text-blue-500" /> AI-Powered Interview Intelligence
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 max-w-4xl tracking-tight leading-[1.1] mb-8">
          Master Your Next <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            Tech Interview
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl font-medium leading-relaxed mb-10">
          Simulate real-world tech interviews with voice-enabled AI. Get instant, actionable feedback on System Design, DSA, and Behavioral questions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-4">
          <Link href="/auth?mode=signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-16 rounded-2xl px-10 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xl shadow-blue-200 active:scale-95 group">
              Start Practicing Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 flex items-center justify-center gap-6 text-sm font-bold text-gray-500 flex-wrap">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Voice & Text Support</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Instant Feedback</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> No Credit Card Required</div>
        </div>
      </section>

      {/* Categories / Domains */}
      <section id="features" className="py-24 px-6 md:px-12 bg-white border-y border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-extrabold text-blue-600 uppercase tracking-widest mb-3">Interview Categories</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Practice What Matters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'System Design', icon: Monitor, desc: 'Scalability, architecture & distributed systems.', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:border-purple-400 hover:shadow-purple-100' },
              { title: 'DSA', icon: Brain, desc: 'Arrays, trees, graphs & dynamic programming.', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hover: 'hover:border-green-400 hover:shadow-green-100' },
              { title: 'Development', icon: Code2, desc: 'Frontend, backend, APIs & full-stack concepts.', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:border-blue-400 hover:shadow-blue-100' },
              { title: 'Behavioral', icon: Star, desc: 'Teamwork, leadership & communication skills.', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:border-orange-400 hover:shadow-orange-100' },
            ].map((cat) => (
              <div key={cat.title} className={`bg-white rounded-3xl p-8 border-2 ${cat.border} transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-lg shadow-gray-100/50 ${cat.hover} relative overflow-hidden group`}>
                <div className={`w-16 h-16 rounded-2xl ${cat.bg} border border-white shadow-sm flex items-center justify-center mb-6 relative z-10 transition-transform duration-300 group-hover:scale-110`}>
                  <cat.icon className={`h-8 w-8 ${cat.text}`} />
                </div>
                <h3 className="font-extrabold text-2xl mb-3 text-gray-900 relative z-10">{cat.title}</h3>
                <p className="text-gray-500 font-medium text-base relative z-10">{cat.desc}</p>
                <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full ${cat.bg} opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-sm font-extrabold text-blue-600 uppercase tracking-widest mb-3">Workflow</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">How PrepAI Works</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[40px] left-[15%] w-[70%] h-1 border-t-2 border-dashed border-gray-200 -z-10" />

          {[
            { step: '1', title: 'Configure Session', icon: Code2, desc: 'Select your target category, difficulty complexity, and focus topics.' },
            { step: '2', title: 'Live Interaction', icon: Mic, desc: 'Engage with our AI via voice or text in a realistic, timed scenario.' },
            { step: '3', title: 'Detailed Feedback', icon: MessageSquare, desc: 'Get scored on technical accuracy, communication, and problem-solving.' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center relative">
              <div className="w-20 h-20 bg-white border-4 border-gray-100 rounded-3xl shadow-xl flex items-center justify-center text-blue-600 mb-8 relative bg-clip-padding">
                <item.icon className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  {item.step}
                </div>
              </div>
              <h3 className="font-extrabold text-2xl mb-3 text-gray-900">{item.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comprehensive Coverage - Modernized */}
      <section className="py-24 px-6 md:px-12 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest mb-3">Limitless Practice</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Comprehensive Tech Coverage</h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our AI is trained on thousands of technical concepts across every major software engineering domain.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Programming Languages',
                skills: ['Python', 'JavaScript / TS', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'Swift']
              },
              {
                title: 'System Design & Architecture',
                skills: ['Distributed Systems', 'Microservices', 'Database Design', 'Caching', 'Load Balancing', 'API Design']
              },
              {
                title: 'Frameworks & Technologies',
                skills: ['React / Next.js', 'Node.js / Express', 'Spring Boot', 'Django', 'REST / GraphQL', 'SQL / NoSQL']
              }
            ].map((area) => (
              <div key={area.title} className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-3xl p-8 hover:border-gray-500 hover:bg-gray-800/80 transition-all duration-300">
                <h4 className="text-xl font-bold mb-6 text-white">{area.title}</h4>
                <div className="flex flex-wrap gap-2">
                  {area.skills.map(skill => (
                    <span key={skill} className="bg-gray-900 border border-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-xl">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Link href="/auth?mode=signup">
              <Button size="lg" className="rounded-xl px-12 py-7 text-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold transition-all shadow-2xl shadow-blue-900/50 active:scale-95">
                Start Your Journey Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-900 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">PrepAI</span>
          </div>
          <div className="text-sm font-medium">
            © {new Date().getFullYear()} PrepAI. Engineering Interview Intelligence.
          </div>
        </div>
      </footer>
    </div>
  );
}
