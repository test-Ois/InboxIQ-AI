/**
 * ParticleBackground.tsx
 * Parent Controller Component for the procedural particle background.
 * Binds the physics engine, canvas renderer, event listeners, and interactive dashboard.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ParticleEngine, EngineConfig } from './ParticleEngine';
import { CanvasRenderer } from './CanvasRenderer';
import { Sliders, X, ChevronRight, Settings, Zap, Shield, Play, Pause, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Exposed settings configuration defaults
const DEFAULT_CONFIG: EngineConfig = {
  particleCount: 6000,
  particleSpeed: 0.65,
  noiseScale: 2.0,
  noiseStrength: 1.6,
  flowStrength: 1.2,
  particleSize: 1.25,
  opacity: 0.85,
  glowIntensity: 1.1,
  waveFrequency: 1.2,
  mouseInfluence: 1.6,
  animationSpeed: 0.75,
};

// Preset configurations for the Control Center
interface Preset {
  name: string;
  description: string;
  icon: React.ReactNode;
  config: Partial<EngineConfig>;
}

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Mouse state refs to avoid React re-render triggers
  const mouseRef = useRef({ x: 0, y: 0, isOver: false });
  const isPausedRef = useRef(false);

  // React states for the Control Center Panel
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState(60);
  const [isMobile, setIsMobile] = useState(false);
  const [isEngineActive, setIsEngineActive] = useState(true);

  // Performance frame counters
  const fpsFrameCount = useRef(0);
  const fpsLastTime = useRef(0);

  // Define presets
  const presets: Preset[] = [
    {
      name: 'Calm Neural Net',
      description: 'Slow, organic flows representing cognitive AI pathways.',
      icon: <Activity className="w-3.5 h-3.5" />,
      config: {
        particleCount: 6000,
        particleSpeed: 0.5,
        noiseScale: 2.0,
        noiseStrength: 1.5,
        flowStrength: 1.0,
        particleSize: 1.2,
        opacity: 0.8,
        glowIntensity: 1.0,
        waveFrequency: 1.0,
        animationSpeed: 0.6,
      },
    },
    {
      name: 'Quantum Drift',
      description: 'Speedy, lightweight nodes emitting high-energy flashes.',
      icon: <Zap className="w-3.5 h-3.5" />,
      config: {
        particleCount: 7500,
        particleSpeed: 1.05,
        noiseScale: 3.5,
        noiseStrength: 2.4,
        flowStrength: 1.8,
        particleSize: 1.0,
        opacity: 0.9,
        glowIntensity: 1.6,
        waveFrequency: 2.2,
        animationSpeed: 1.3,
      },
    },
    {
      name: 'Security Shield',
      description: 'Densely aligned streams forming cryptographic mesh defenses.',
      icon: <Shield className="w-3.5 h-3.5" />,
      config: {
        particleCount: 8000,
        particleSpeed: 0.35,
        noiseScale: 1.2,
        noiseStrength: 0.8,
        flowStrength: 2.0,
        particleSize: 1.4,
        opacity: 0.95,
        glowIntensity: 0.8,
        waveFrequency: 0.6,
        animationSpeed: 0.4,
      },
    },
  ];

  // 1. Check for mobile viewport on mount and handle responsive downscaling
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && engineRef.current) {
        // Drop count to 1800 on mobile for 60 FPS rendering on budget devices
        engineRef.current.updateConfig({ particleCount: 1800 });
        setConfig(prev => ({ ...prev, particleCount: 1800 }));
      } else if (!mobile && engineRef.current) {
        engineRef.current.updateConfig({ particleCount: config.particleCount });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Initialize Canvas Renderer and Physics Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set initial size
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Stagger count on mobile
    const initialCount = window.innerWidth < 768 ? 1800 : config.particleCount;
    const activeConfig = { ...config, particleCount: initialCount };

    // Instantiate engine and renderer
    const engine = new ParticleEngine(width, height, activeConfig);
    const renderer = new CanvasRenderer(canvas);
    
    renderer.resize(width, height);
    engineRef.current = engine;
    rendererRef.current = renderer;

    // Handle viewport resize
    const handleResize = () => {
      const r = container.getBoundingClientRect();
      engine.resize(r.width, r.height);
      renderer.resize(r.width, r.height);
    };
    
    window.addEventListener('resize', handleResize);

    // 3. Document Visibility Change (Pause tab when inactive)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
      } else {
        isPausedRef.current = false;
        lastTimeRef.current = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Start Animation Loop
    lastTimeRef.current = performance.now();
    fpsLastTime.current = performance.now();
    
    const tick = (now: number) => {
      if (isPausedRef.current || !isEngineActive) {
        requestRef.current = requestAnimationFrame(tick);
        return;
      }

      // Calculate delta time
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // FPS tracking (smoothed over 1 second)
      fpsFrameCount.current++;
      if (now - fpsLastTime.current >= 1000) {
        setFps(Math.round((fpsFrameCount.current * 1000) / (now - fpsLastTime.current)));
        fpsFrameCount.current = 0;
        fpsLastTime.current = now;
      }

      // Physics Update
      engine.update(
        now * 0.001,
        mouseRef.current.x,
        mouseRef.current.y,
        mouseRef.current.isOver
      );

      // Render Frame
      renderer.render(
        engine.particles,
        now * 0.001,
        mouseRef.current.x,
        mouseRef.current.y,
        mouseRef.current.isOver,
        activeConfig
      );

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    // Cleanup listeners and cancel animation on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEngineActive]);

  // 5. Update engine config whenever state changes
  const handleConfigChange = (key: keyof EngineConfig, value: number) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      if (engineRef.current) {
        engineRef.current.updateConfig(updated);
      }
      return updated;
    });
  };

  // 6. Apply pre-loaded presets
  const applyPreset = (preset: Preset) => {
    const updated = { ...config, ...preset.config };
    if (isMobile) {
      updated.particleCount = 1800; // force mobile limit
    }
    setConfig(updated);
    if (engineRef.current) {
      engineRef.current.updateConfig(updated);
      // Re-initialize particles to apply new density/depth layers immediately
      engineRef.current.initParticles();
    }
  };

  // 7. Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isOver: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.isOver = false;
  };

  const handleMouseEnter = () => {
    mouseRef.current.isOver = true;
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none bg-[#050608] z-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {/* Canvas Layer */}
      <canvas 
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />

      {/* Glassmorphic Flow Field Control Center (Raycast/Linear Style) */}
      <div className="absolute bottom-6 left-6 z-30 font-sans pointer-events-auto">
        <AnimatePresence initial={false} mode="wait">
          {!isOpen ? (
            // Collapsed Capsule Trigger Button
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.05] bg-[#0A0D14]/85 backdrop-blur-md hover:bg-[#0E121C]/90 hover:border-white/[0.1] text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            >
              <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Flow Control</span>
              <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 font-mono">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                {fps} FPS
              </div>
            </motion.button>
          ) : (
            // Expanded Settings Panel
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="w-80 rounded-2xl border border-white/[0.05] bg-[#0A0D14]/90 backdrop-blur-xl p-5 text-left shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col gap-4.5 max-h-[480px] overflow-y-auto no-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-sky-400">InboxIQ Engine</h4>
                  <p className="text-[9px] text-zinc-500 font-medium">Procedural Vector Field Controller</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEngineActive(!isEngineActive)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isEngineActive 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                    title={isEngineActive ? 'Pause Engine' : 'Resume Engine'}
                  >
                    {isEngineActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg border border-white/[0.05] hover:border-white/10 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                <div className="bg-white/[0.02] border border-white/[0.03] p-2 rounded-xl flex flex-col justify-between">
                  <span className="text-zinc-500">ENGINE STATE</span>
                  <span className={`font-bold mt-1 uppercase ${isEngineActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isEngineActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.03] p-2 rounded-xl flex flex-col justify-between">
                  <span className="text-zinc-500">PERFORMANCE</span>
                  <span className="text-white font-bold mt-1 flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full ${fps > 55 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {fps} FPS
                  </span>
                </div>
              </div>

              {/* Preset Selector */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Presets</label>
                <div className="flex flex-col gap-1.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="flex items-center justify-between w-full p-2 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.06] text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-zinc-950 text-zinc-400 group-hover:text-sky-400 transition-colors">
                          {preset.icon}
                        </div>
                        <div>
                          <p className="text-[9.5px] font-bold text-zinc-300 group-hover:text-white transition-colors">{preset.name}</p>
                          <p className="text-[8px] text-zinc-500 leading-normal line-clamp-1">{preset.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders Container */}
              <div className="space-y-3.5 border-t border-white/[0.04] pt-4.5 overflow-y-auto max-h-56 pr-1 custom-scrollbar">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Parameters</label>
                
                {/* 1. Particle Count */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Particle Count</span>
                    <span className="text-zinc-500 font-mono font-bold">
                      {isMobile ? `${config.particleCount} (Mobile Lock)` : config.particleCount}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max={isMobile ? "2000" : "9000"}
                    step="500"
                    disabled={isMobile}
                    value={config.particleCount}
                    onChange={(e) => handleConfigChange('particleCount', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {/* 2. Particle Speed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Particle Speed</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.particleSpeed.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.05"
                    value={config.particleSpeed}
                    onChange={(e) => handleConfigChange('particleSpeed', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 3. Noise Scale */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Noise Scale</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.noiseScale.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={config.noiseScale}
                    onChange={(e) => handleConfigChange('noiseScale', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 4. Noise Strength */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Noise Strength (Chaos)</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.noiseStrength.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.5"
                    step="0.1"
                    value={config.noiseStrength}
                    onChange={(e) => handleConfigChange('noiseStrength', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 5. Flow Strength */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Flow Strength</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.flowStrength.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={config.flowStrength}
                    onChange={(e) => handleConfigChange('flowStrength', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 6. Particle Size */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Particle Size</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.particleSize.toFixed(2)}px</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.1"
                    value={config.particleSize}
                    onChange={(e) => handleConfigChange('particleSize', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 7. Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Global Opacity</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.opacity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={config.opacity}
                    onChange={(e) => handleConfigChange('opacity', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 8. Glow Intensity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Glow Intensity</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.glowIntensity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.5"
                    step="0.1"
                    value={config.glowIntensity}
                    onChange={(e) => handleConfigChange('glowIntensity', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 9. Wave Frequency */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Wave Frequency</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.waveFrequency.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={config.waveFrequency}
                    onChange={(e) => handleConfigChange('waveFrequency', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 10. Mouse Influence */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Mouse Influence</span>
                    <span className="text-zinc-550 font-mono font-bold">{config.mouseInfluence.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={config.mouseInfluence}
                    onChange={(e) => handleConfigChange('mouseInfluence', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

                {/* 11. Animation Speed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-400 font-medium">Morph Speed (Z Axis)</span>
                    <span className="text-zinc-500 font-mono font-bold">{config.animationSpeed.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="2.5"
                    step="0.05"
                    value={config.animationSpeed}
                    onChange={(e) => handleConfigChange('animationSpeed', parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
                  />
                </div>

              </div>

              {/* Reset to Default */}
              <button
                onClick={() => {
                  const initialCount = isMobile ? 1800 : DEFAULT_CONFIG.particleCount;
                  const updated = { ...DEFAULT_CONFIG, particleCount: initialCount };
                  setConfig(updated);
                  if (engineRef.current) {
                    engineRef.current.updateConfig(updated);
                    engineRef.current.initParticles();
                  }
                }}
                className="w-full py-2 rounded-xl border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.02] text-zinc-400 hover:text-white transition-all text-[9.5px] font-bold uppercase tracking-wider cursor-pointer font-mono"
              >
                Reset Settings
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default ParticleBackground;
