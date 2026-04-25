/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    blueprint: "Primary demographic showing high resonance with asynchronous educational content. Shift detected towards high-fidelity technical storytelling.",
    protocol: "Deploying Phase 3 Narrative structures. Focus on modular deployment models and verifiable technical proof-of-concepts."
  });
  
  const handleSynthesis = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const result = await res.json();
        setData({
          blueprint: result.blueprint || data.blueprint,
          protocol: result.protocol || data.protocol
        });
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col">
      <nav className="h-16 border-b border-white/10 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#8b5cf6] to-[#c084fc] rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
          <span className="font-space text-xl font-bold tracking-tight">CLAUDE <span className="text-[#c084fc]">CATALYST</span></span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-white/60">
          <a href="#" className="text-[#c084fc] border-b-2 border-[#c084fc] pb-1">Dashboard</a>
          <a href="#" className="hover:text-white transition-colors">Protocols</a>
          <a href="#" className="hover:text-white transition-colors">Trend Vault</a>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-2 text-[#8b5cf6] font-mono text-xs">
            <div className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse"></div>
            GEMINI_CONNECTED_V2
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden max-w-[1400px] mx-auto w-full">
        <section className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="font-space text-xs uppercase tracking-widest text-white/40">Active Blueprints</h2>
            <div className="space-y-3">
              <div className="p-3 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-xl">
                <p className="text-sm font-medium mb-1">GenZ Aesthetic Shift</p>
                <p className="text-[10px] font-mono text-white/40">ID: 882-QX-4</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                <p className="text-sm font-medium mb-1">Micro-Niche Scaling</p>
                <p className="text-[10px] font-mono text-white/40">ID: 104-LK-2</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                <p className="text-sm font-medium mb-1">SaaS Narrative Flow</p>
                <p className="text-[10px] font-mono text-white/40">ID: 449-ZA-9</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-[#8b5cf6]/20 to-transparent border border-[#8b5cf6]/20 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="font-mono text-[10px] text-[#c084fc]">ANALYTICS_OS</span>
              <span className="text-[10px] text-white/40">98.4% Accuracy</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/60">Trend Saturation</span>
                  <span>42%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#8b5cf6] w-[42%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/60">Audience Synergy</span>
                  <span>89%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c084fc] w-[89%]"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 flex flex-col gap-6">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b5cf6]/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 relative z-10 gap-4">
              <div>
                <h1 className="font-space text-4xl font-bold mb-2">Real-time Synthesis</h1>
                <p className="text-white/40 text-sm">Analyzing current digital zeitgeist for Claude Creator Catalyst.</p>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 self-start">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-[#c084fc]"
                  animate={{ opacity: loading ? [0.5, 1, 0.5] : 1 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <span className="text-xs font-mono text-[#c084fc]">
                  {loading ? "MODE: SYNTHESIZING_CORE" : "MODE: AGGRESSIVE_CATALYST"}
                </span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <motion.div 
                key={data.blueprint}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 border border-white/5 p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-[#8b5cf6] rounded-full"></div>
                  <h3 className="font-space font-semibold">Audience Blueprint</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  {data.blueprint}
                </p>
              </motion.div>
              <motion.div 
                key={data.protocol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-black/40 border border-white/5 p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-[#c084fc] rounded-full"></div>
                  <h3 className="font-space font-semibold">Content Protocol</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  {data.protocol}
                </p>
              </motion.div>
            </div>

            <div className="mt-8 relative z-10">
              <div className="bg-[#8b5cf6] text-black p-2 pl-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 focus-within:ring-2 focus-within:ring-[#c084fc] transition-shadow">
                <input 
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSynthesis()}
                  placeholder="PROMPT_ENGINE_INPUT: Ready for synthesis instructions..."
                  className="font-mono text-xs font-bold w-full bg-transparent outline-none placeholder:text-black/50"
                  disabled={loading}
                />
                <button 
                  onClick={handleSynthesis}
                  disabled={loading || !prompt.trim()}
                  className="shrink-0 flex items-center justify-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold cursor-pointer hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "SYNTHESIZING..." : "RUN_AI_SYNTHESIS"}
                </button>
              </div>
            </div>
          </div>

          <footer className="h-12 flex flex-wrap items-center justify-between px-2 text-[10px] font-mono text-white/30 tracking-widest gap-2">
            <div>NODE_JS_DEPLOYMENT: HOSTINGER_ACTIVE</div>
            <div className="hidden sm:block">FIREBASE_AUTH: ENCRYPTED</div>
            <div>TIMESTAMP: {new Date().toISOString().replace('T', '_').split('.')[0]}_UTC</div>
          </footer>
        </section>
      </main>
    </div>
  );
}
