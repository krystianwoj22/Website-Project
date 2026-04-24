/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Youtube, 
  Target, 
  TrendingUp, 
  Loader2, 
  ChevronRight,
  Monitor,
  Lightbulb,
  Users,
  LogOut,
  History,
  Trash2
} from 'lucide-react';
import { cn } from './lib/utils';
import { auth, db, googleProvider, handleFirestoreError } from './lib/firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  orderBy, 
  deleteDoc, 
  doc, 
  getDocFromServer
} from 'firebase/firestore';

type AudienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

interface VideoIdea {
  id?: string;
  title: string;
  thumbnailConcept: string;
  viewPotential: string;
  whyItWorks: string;
  audience?: AudienceLevel;
  createdAt?: any;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [audience, setAudience] = useState<AudienceLevel>('Beginner');
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<VideoIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u && u.emailVerified) {
        fetchSavedIdeas(u.uid);
      } else {
        setSavedIdeas([]);
      }
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError('Login failed');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIdeas([]);
      setShowHistory(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSavedIdeas = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'video_ideas'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as VideoIdea));
      setSavedIdeas(fetched);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, 'list', 'video_ideas');
    }
  };

  const saveIdea = async (idea: VideoIdea) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'video_ideas'), {
        ...idea,
        userId: user.uid,
        audience,
        createdAt: serverTimestamp()
      });
      const newIdea = { ...idea, id: docRef.id, audience, createdAt: new Date().toISOString() };
      setSavedIdeas(prev => [newIdea, ...prev]);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, 'create', 'video_ideas');
    }
  };

  const deleteIdea = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'video_ideas', id));
      setSavedIdeas(prev => prev.filter(idea => idea.id !== id));
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, 'delete', `video_ideas/${id}`);
    }
  };

  const generateIdeas = async () => {
    if (!user) {
      setError('Please login to generate ideas');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is missing');

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert YouTube strategist and Claude AI educator.
        Generate 10 high-potential YouTube video ideas specifically about Claude (Anthropic's AI).
        
        Target Audience Level: ${audience}
        
        Recent Trending Claude Topics to incorporate (Context):
        - Claude 3.5 Sonnet & Opus excellence
        - Claude Artifacts (building apps, games, tools instantly)
        - Claude Computer Use (autonomous desktop automation)
        - Model Context Protocol (MCP) for local tool integration
        - Claude Projects and massive context windows (200k+)
        - Prompt Engineering with XML tags
        - Claude vs GPT-4o comparisons
        - Coding with Claude & Cursor integration
        
        For each idea, provide:
        1. Video Title (Click-worthy, high CTR)
        2. Thumbnail Concept Description (Visual elements and text overlays)
        3. Estimated View Potential (e.g., 50k - 200k+ based on current trends)
        4. Why it works (Brief logic on why this topic is hot right now for this audience level)

        Format the output as a JSON array of objects with keys: "title", "thumbnailConcept", "viewPotential", "whyItWorks".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || '[]';
      const parsedIdeas = JSON.parse(responseText);
      
      setIdeas(parsedIdeas);
      
      // Auto-save if logged in
      if (user) {
        for (const idea of parsedIdeas.slice(0, 3)) {
          await saveIdea(idea);
        }
      }

    } catch (err: any) {
      console.error(err);
      setError('Failed to generate ideas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ui-bg text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Precision Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-ui-border bg-ui-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-900/20">
              C
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase italic">
                Claude<span className="text-brand-primary">Catalyst</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-mono tracking-tighter">IDEATION_NODE_CONNECTED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <button 
                onClick={login}
                className="bg-white text-slate-950 px-4 py-1.5 rounded text-xs font-bold transition-all hover:bg-slate-200"
              >
                AUTHORIZE_SESSION
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "p-2 rounded transition-all border",
                    showHistory 
                      ? "bg-violet-600 border-violet-500 text-white shadow-inner" 
                      : "bg-slate-900 border-ui-border text-slate-400 hover:text-white"
                  )}
                  title="Archive Vault"
                >
                  <History size={16} />
                </button>
                <div className="h-4 w-px bg-slate-800" />
                <div className="flex items-center gap-2 pr-2">
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">USER:</span>
                  <span className="text-xs font-bold text-slate-300">{user.displayName?.split(' ')[0].toUpperCase()}</span>
                  <button onClick={logout} className="p-1 px-2 text-slate-600 hover:text-red-400 transition-colors">
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Interaction Bar */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-start lg:items-center justify-between">
          <div>
            <span className="label-mono mb-1 block opacity-60">Strategic Parameters</span>
            <div className="flex bg-slate-900 p-1 border border-ui-border rounded-lg shadow-inner">
              {(['Beginner', 'Intermediate', 'Advanced'] as AudienceLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setAudience(level)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                    audience === level 
                      ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" 
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button
              id="btn-generate"
              onClick={generateIdeas}
              disabled={isGenerating || !user}
              className="flex-1 lg:flex-none bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-violet-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGenerating ? 'Synthesizing...' : 'Initialize Generation'}
            </button>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <main className="min-h-[500px]">
          <div className="flex justify-between items-end mb-8 px-2">
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-brand-primary font-display font-bold mb-1">
                {showHistory ? 'Archived Blueprints' : 'Real-time Analysis'}
              </h2>
              <p className="text-[10px] text-slate-500 font-sans tracking-wide uppercase font-medium">
                {showHistory 
                  ? `${savedIdeas.length} vectors stored in local vault`
                  : `Engaging trend protocols for ${audience.toLowerCase()} segments`
                }
              </p>
            </div>
          </div>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-900 rounded-3xl">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-ui-border">
                <Users className="text-slate-700 w-8 h-8" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-2">Authentication Layer Locked</h2>
              <p className="text-slate-500 text-xs max-w-xs mb-8 font-medium leading-relaxed">
                Connect your account to access the Claude Trend Engine and preserve your strategic video blueprints.
              </p>
              <button 
                onClick={login}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-violet-900/30"
              >
                Access System
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-950/20 border border-red-900/40 text-red-400 px-4 py-3 rounded-xl mb-8 text-sm">
                  {error}
                </div>
              )}

              {(!isGenerating && !showHistory && ideas.length === 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-48 rounded border border-ui-border bg-slate-900/10 flex items-center justify-center border-dashed">
                      <Lightbulb size={24} className="text-slate-900" />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-ui-border border border-ui-border rounded overflow-hidden shadow-2xl shadow-black/50">
                <AnimatePresence mode="popLayout">
                  {(showHistory ? savedIdeas : ideas).map((idea, index) => (
                    <motion.div
                      key={idea.id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-ui-bg p-8 flex flex-col justify-between hover:bg-slate-900/30 transition-colors group relative border-none"
                    >
                      <div className="space-y-6">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-black text-xl lg:text-2xl leading-[1.1] text-white">
                            {idea.title}
                          </h3>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="label-mono text-emerald-400">
                              {idea.viewPotential} VIEWS
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950/50 p-6 border-l-2 border-brand-primary/20 hover:border-brand-primary transition-all rounded-r-lg">
                          <p className="label-mono mb-3 opacity-40">Thumbnail Visual</p>
                          <p className="text-sm text-slate-300 font-serif italic leading-relaxed">
                            "{idea.thumbnailConcept}"
                          </p>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-1.5 bg-slate-900 rounded border border-ui-border">
                            <Target size={14} className="text-brand-primary" />
                          </div>
                          <div>
                            <p className="label-mono mb-1">Strategic Logic</p>
                            <p className="text-xs text-slate-400 leading-[1.6] font-medium">
                              {idea.whyItWorks}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-ui-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="label-mono opacity-20 whitespace-nowrap">ID_{index + 1}</span>
                          {idea.audience && (
                            <span className="text-[9px] font-black uppercase text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-ui-border">
                              {idea.audience}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {showHistory && (
                            <button 
                              onClick={() => deleteIdea(idea.id!)}
                              className="text-slate-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary cursor-default group-hover:translate-x-1 transition-transform">
                            {idea.id ? 'VERIFIED' : 'BLUEPRINT'}
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-ui-border/30 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
        <div className="label-mono">Claude Creator Catalyst // V.1.2.0</div>
        <div className="flex gap-8 label-mono">
          <span>Ideation Protocol Beta</span>
          <span>•</span>
          <span>YouTube Meta-Engine</span>
        </div>
      </footer>
      </div>
    </div>
  );
}
