import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Clock, Wine, Beer, Zap, ShieldAlert, ChevronRight } from 'lucide-react';

export const LandingScreen: React.FC = () => {
  const { setIsLoginModalOpen, config } = useStore();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/4 w-[500px] h-[350px] bg-blue-500/5 rounded-full blur-[120px]" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Top Bar with Secret Admin Dot */}
      <header className="relative z-20 w-full px-6 md:px-12 py-6 flex items-center justify-between">
        {/* Left: Store Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-medium text-neutral-300 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Distribuidora Aberta · Depósito Operante</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/60 border border-neutral-800/80 text-xs font-mono text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Right Corner: SECRET ADMIN DOT (Pontinho de Acesso) */}
        <div className="flex items-center gap-4">
          {/* THE SECRET DOT */}
          <div className="relative group">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              aria-label="Acesso Administrativo"
              title="Acesso Administrador"
              className="w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-700/60 hover:bg-blue-500 hover:border-blue-400 hover:scale-125 transition-all duration-300 cursor-pointer shadow-sm relative flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-60 group-hover:animate-ping" />
            </button>
            {/* Discreet Admin Tooltip on hover */}
            <div className="absolute right-0 top-6 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900/90 border border-neutral-800 text-[10px] text-neutral-400 font-mono whitespace-nowrap shadow-xl pointer-events-none z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Acesso Administrador Diego Bebidas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Centerpiece: DIEGO BEBIDAS BEM GRANDE NA TELA */}
      <main className="relative z-10 my-auto w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/40 border border-blue-800/50 text-blue-400 text-xs md:text-sm font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Distribuidora, Adega & Depósito</span>
        </div>

        {/* The Big Name: DIEGO BEBIDAS */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white uppercase drop-shadow-2xl">
          Diego <span className="text-blue-500 inline-block drop-shadow-[0_0_40px_rgba(37,99,235,0.4)]">Bebidas</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl md:text-2xl font-light text-neutral-300 max-w-3xl mx-auto tracking-wide">
          Cervejas Estupidamente Geladas, Destilados Nobres, Refrigerantes, Vinhos, Gelo e Carvão no Atacado e Varejo.
        </p>

        {/* Features row */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Beer className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">Cervejas & Chopp</div>
            <div className="text-xs text-neutral-400 mt-0.5">Fardos, caixas e latões no atacado</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Wine className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">Destilados & Whiskies</div>
            <div className="text-xs text-neutral-400 mt-0.5">Gins, vodkas e combos especiais</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-white">Depósito & Estoque</div>
            <div className="text-xs text-neutral-400 mt-0.5">Câmaras frias e pronta entrega</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <span className="font-bold text-sm text-blue-400 font-mono">PIX</span>
            </div>
            <div className="text-sm font-semibold text-white">PDV Frente de Caixa</div>
            <div className="text-xs text-neutral-400 mt-0.5">Atendimento ágil e cupons fiscais</div>
          </div>
        </div>

        {/* Optional helper hint at the bottom for first-time orientation */}
        <div className="mt-8 flex items-center gap-2 text-xs text-neutral-500">
          <span>{currentDate}</span>
          <span>·</span>
          <span>{config.address}</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full px-6 md:px-12 py-5 border-t border-neutral-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="text-neutral-400 font-medium">Diego Bebidas © {new Date().getFullYear()}</span>
          <span>·</span>
          <span>CNPJ: {config.cnpj}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1.5 text-xs py-1 px-2 rounded hover:bg-neutral-900"
          >
            <span>Painel do Administrador</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
