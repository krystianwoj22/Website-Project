/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Settings, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryImage, StylePreset } from './types';

const STYLES: StylePreset[] = ['Realistic', '3D Render', 'Watercolor', 'Pixel Art'];

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [isApiKeySaved, setIsApiKeySaved] = useState<boolean>(!!localStorage.getItem('GEMINI_API_KEY'));
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>('None');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Initialize GenAI client
  const ai = useMemo(() => {
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }, [apiKey]);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  // Gallery listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const images = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryImage[];
      setGallery(images);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });
    return unsubscribe;
  }, [user]);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      setIsApiKeySaved(true);
    }
  };

  const enhancePrompt = async () => {
    if (!ai || !prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Rewrite this image generation prompt to be more detailed, high-quality, and artistic. Keep it concise but descriptive. 
        Original Prompt: "${prompt}"
        Enhanced Prompt:`,
      });
      if (response.text) {
        setPrompt(response.text.trim());
      }
    } catch (err) {
      console.error("Enhance prompt error:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateImage = async () => {
    if (!ai || !prompt.trim() || !user) return;
    setIsGenerating(true);
    try {
      const fullPrompt = selectedStyle !== 'None' ? `${prompt}, in ${selectedStyle} style` : prompt;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        // Save to Firestore
        await addDoc(collection(db, 'gallery'), {
          url: imageUrl,
          prompt: fullPrompt,
          style: selectedStyle,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Generate image error:", err);
    } finally {
      setIsGenerating(false);
      setPrompt('');
      setSelectedStyle('None');
    }
  };

  const deleteImage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this image?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `gallery/${id}`);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Settings Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight hidden sm:block">Nano Banana</h1>
          </div>

          <div className="flex-1 max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="password"
                placeholder="Paste Gemini API Key..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsApiKeySaved(false);
                }}
              />
            </div>
            <button 
              onClick={saveApiKey}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            {isApiKeySaved ? (
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-500/10 px-2.5 py-1 rounded-full border border-zinc-500/20">
                <AlertCircle className="w-3 h-3" /> No Key
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Generation Section */}
        <section className="bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-zinc-800 shadow-2xl space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-medium text-zinc-400 block ml-1 uppercase tracking-widest">
              What do you want to see?
            </label>
            <textarea 
              placeholder="A futuristic city with flying neon bananas..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 min-h-[120px] text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none shadow-inner"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(selectedStyle === style ? 'None' : style)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  selectedStyle === style 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={enhancePrompt}
              disabled={isEnhancing || !prompt || !isApiKeySaved}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 h-14 rounded-2xl font-bold transition-all cursor-pointer"
            >
              {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-purple-400" />}
              Enhance Prompt
            </button>
            <button 
              onClick={generateImage}
              disabled={isGenerating || !prompt || !isApiKeySaved}
              className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed h-14 rounded-2xl font-bold text-white shadow-xl shadow-purple-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Generate Image
            </button>
          </div>

          {!isApiKeySaved && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-200">
                Please add and save your Gemini API Key in the settings bar at the top to start generating images.
              </p>
            </div>
          )}
        </section>

        {/* Gallery Section */}
        <section className="space-y-8 pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight px-1">Global Gallery</h2>
            <div className="h-px flex-1 bg-zinc-800 mx-6 hidden sm:block" />
            <span className="text-zinc-500 text-sm font-mono">{gallery.length} Images</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {gallery.map((img) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-lg"
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={img.url} 
                      alt={img.prompt} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(img.url, `banana-gen-${img.id}.png`);
                          }}
                          className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-xl backdrop-blur-sm transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {user?.uid === img.userId && (
                          <button 
                            onClick={(e) => deleteImage(e, img.id)}
                            className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-xl backdrop-blur-sm transition-colors text-red-400 ml-auto cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                      {img.prompt}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {gallery.length === 0 && !isGenerating && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="inline-block p-4 bg-zinc-900 rounded-full border border-zinc-800">
                  <ImageIcon className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500">No images generated yet. Be the first!</p>
              </div>
            )}

            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-square bg-zinc-900 rounded-3xl border-2 border-dashed border-purple-500/30 flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-sm font-medium text-purple-200">The AI is painting your thoughts...</p>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-zinc-900 w-full max-w-5xl max-h-[90vh] rounded-[40px] shadow-2xl border border-zinc-500/20 overflow-hidden flex flex-col md:flex-row shadow-purple-500/10"
            >
              <div className="flex-1 bg-black flex items-center justify-center p-4">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.prompt} 
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-purple-500/5"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full md:w-[380px] p-8 flex flex-col gap-6 overflow-y-auto">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-xl">Image Details</h3>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Prompt Used</label>
                  <p className="text-zinc-200 leading-relaxed bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                    {selectedImage.prompt}
                  </p>
                </div>

                {selectedImage.style !== 'None' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Style</label>
                    <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-medium">
                      {selectedImage.style}
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-6 flex gap-3 border-t border-zinc-800">
                  <button 
                    onClick={() => downloadImage(selectedImage.url, `banana-highres-${selectedImage.id}.png`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white h-12 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
