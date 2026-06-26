'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useSession } from 'next-auth/react';
import { User, Shield, KeyRound, Bot, Sliders } from 'lucide-react';
import React, { useState } from 'react';
import { InlineLoader } from '@/components/ui';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const isSessionLoading = status === 'loading';

  
  // Future AI Toggle states (visual demonstration)
  const [aiEnabled, setAiEnabled] = useState(true);
  const [taskEnabled, setTaskEnabled] = useState(false);
  const [fraudEnabled, setFraudEnabled] = useState(false);

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 font-sans">Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure your email intelligence integration preferences.</p>
        </div>

        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-6">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-zinc-200">User Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Display Name</label>
              <div className="mt-1 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/35 text-sm text-zinc-300 min-h-[46px] flex items-center">
                {isSessionLoading ? (
                  <InlineLoader text="Loading display name..." />
                ) : (
                  session?.user?.name || 'Unknown User'
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="mt-1 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/35 text-sm text-zinc-300 min-h-[46px] flex items-center">
                {isSessionLoading ? (
                  <InlineLoader text="Loading email address..." />
                ) : (
                  session?.user?.email || 'Unknown Email'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security / Separated Scope Credentials Disclaimer */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-zinc-200">Security & Decoupled Scopes</h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            InboxIQ AI implements a strict **separated scope credentials policy**. NextAuth manages account creation using basic profile scopes. Access to your inbox messages requires explicit consent to the `gmail.readonly` scope, which is handled completely inside our backend NestJS tier. 
          </p>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary/85">
            <KeyRound className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Token Security:</strong> All Google access and refresh tokens are encrypted at-rest using AES-256-GCM. Decryption occurs only in memory when the background worker queries message delta logs. Raw credentials are never exposed to browser clients.
            </p>
          </div>
        </div>

        {/* Future Modules Scaffolding */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800">
          <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-zinc-200">Future AI Modules Scaffolding</h2>
            </div>
            <span className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">Phase 2+ Previews</span>
          </div>

          <div className="p-6 divide-y divide-zinc-900 space-y-6">
            
            {/* Toggle 1 */}
            <div className="flex items-center justify-between pt-0 pb-6">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-zinc-200">AI Email Analysis Service</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Enables summarizing, categorizing (work, personal, finance), and assessing the sentiment of received emails.
                </p>
              </div>
              <button 
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-250 ${aiEnabled ? 'bg-primary' : 'bg-zinc-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-250 ${aiEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between py-6">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-zinc-200">Task Intelligence Service</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Extracts checklists, action items, and suggest calendars automatically from incoming message context.
                </p>
              </div>
              <button 
                onClick={() => setTaskEnabled(!taskEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-250 ${taskEnabled ? 'bg-primary' : 'bg-zinc-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-250 ${taskEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between py-6">
              <div className="max-w-md">
                <p className="text-sm font-semibold text-zinc-200">Fraud & Phishing Detection Engine</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Runs threat evaluations and triggers urgent alert notifications if spear phishing or social engineering is detected.
                </p>
              </div>
              <button 
                onClick={() => setFraudEnabled(!fraudEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-250 ${fraudEnabled ? 'bg-primary' : 'bg-zinc-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-250 ${fraudEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
