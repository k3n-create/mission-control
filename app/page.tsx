"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

const humanOperators = [{ name: "K3n", role: "Founder", status: "online" }];
const aiAgents = [
  { name: "JARVIS", role: "Chief of Staff", status: "online" },
  { name: "BLAZE", role: "Scout", status: "busy" },
  { name: "NOVA", role: "Analyst", status: "online" },
  { name: "SAGE", role: "Researcher", status: "online" },
  { name: "AXEL", role: "Builder", status: "away" },
];

const columns = [
  { name: "INBOX", count: 3 }, { name: "ASSIGNED", count: 2 },
  { name: "IN PROGRESS", count: 3 }, { name: "REVIEW", count: 1 }, { name: "DONE", count: 3 },
];

const tasks: Record<string, Array<{id: string; title: string; tags?: string[]; assignee?: string}>> = {
  "INBOX": [{id:"1",title:"Upgrade Protocols",tags:["comm","enc"]},{id:"2",title:"Q2 Revenue Reports",tags:["finance"]},{id:"3",title:"Security Patches",tags:["security"]}],
  "ASSIGNED": [{id:"4",title:"Reinforce Firewall",tags:["security"],assignee:"JARVIS"},{id:"5",title:"Analytics Dashboard",tags:["frontend"],assignee:"AXEL"}],
  "IN PROGRESS": [{id:"6",title:"CRITICAL: Breach",tags:["security"],assignee:"BLAZE"},{id:"7",title:"Neural Upgrade",tags:["ai"],assignee:"NOVA"},{id:"8",title:"DB Optimization",tags:["backend"],assignee:"JARVIS"}],
  "REVIEW": [{id:"9",title:"System Audit",tags:["security"],assignee:"SAGE"}],
  "DONE": [{id:"10",title:"Network Map",tags:["infra"]},{id:"11",title:"Agent Manual",tags:["docs"]},{id:"12",title:"API Gateway",tags:["backend"]}],
};

const scheduledJobs = [
  { name: "Memory Sync", freq: "5 min", progress: 100 },
  { name: "GitHub Backup", freq: "1 hour", progress: 100 },
  { name: "Email Check", freq: "30 min", progress: 100 },
  { name: "Health Check", freq: "10 min", progress: 98 },
];

const getColumnStyle = (name: string) => {
  const styles: Record<string, {bar: string; dot: string; glow: string}> = {
    "INBOX": {bar:"bg-blue-500",dot:"bg-blue-500",glow:"shadow-[0_0_12px_rgba(59,130,246,0.3)]"},
    "ASSIGNED": {bar:"bg-purple-500",dot:"bg-purple-500",glow:"shadow-[0_0_12px_rgba(168,85,247,0.3)]"},
    "IN PROGRESS": {bar:"bg-orange-500",dot:"bg-orange-500",glow:"shadow-[0_0_12px_rgba(249,115,22,0.3)]"},
    "REVIEW": {bar:"bg-yellow-500",dot:"bg-yellow-500",glow:"shadow-[0_0_12px_rgba(234,179,8,0.3)]"},
    "DONE": {bar:"bg-green-500",dot:"bg-green-500",glow:"shadow-[0_0_12px_rgba(34,197,94,0.3)]"},
  };
  return styles[name] || styles["INBOX"];
};

const CircularProgress = ({ progress, color }: { progress: number; color: string }) => {
  const radius = 16, circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div className="relative w-8 h-8">
      <svg className="w-8 h-8 -rotate-90">
        <circle cx="16" cy="16" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
        <circle cx="16" cy="16" r={radius} stroke={color} strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-mono">{progress}%</span>
    </div>
  );
};

export default function VisualOffice() {
  const getDot = (s: string) => s === "online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : s === "busy" ? "bg-red-500" : "bg-gray-500";
  const cardStyle = "bg-[rgba(15,15,17,0.7)] backdrop-blur-xl border border-white/10 rounded-lg";

  return (
    <div className="flex h-screen text-sm font-sans relative overflow-hidden">
      <style>{`body { background-image: url('/background.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat; }`}</style>
      
      <div className="absolute inset-0 bg-[#0A0A0B]/50 z-0"></div>
      
      {/* LEFT */}
      <div className={`w-16 ${cardStyle} m-2 flex flex-col items-center py-4 z-10`}>
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center text-white font-bold text-sm mb-6">N</div>
        <div className="mb-6">
          <div className="text-[8px] text-gray-400 text-center mb-1">JARVIS</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.8)] animate-pulse"></span><span className="text-[8px] text-cyan-400 font-mono">ONLINE</span></div>
        </div>
        <div className="mb-4"><div className="text-[8px] text-gray-500 text-center mb-2">HUMAN</div>{humanOperators.map(op => <div key={op.name} className="flex flex-col items-center gap-1 mb-2"><span className={`w-2 h-2 rounded-full ${getDot(op.status)}`}></span><span className="text-white text-[8px]">{op.name}</span></div>)}</div>
        <div className="flex-1"><div className="text-[8px] text-gray-500 text-center mb-2">AGENTS</div>{aiAgents.map(a => <div key={a.name} className="flex flex-col items-center gap-1 mb-2"><span className={`w-2 h-2 rounded-full ${getDot(a.status)}`}></span><span className="text-white text-[8px]">{a.name}</span></div>)}</div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex p-2 gap-5 overflow-hidden z-10">
        {columns.map(col => {
          const style = getColumnStyle(col.name);
          return (
            <div key={col.name} className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-2"><div className={`w-1 h-4 ${style.bar} rounded-full`}></div><span className="text-white font-semibold text-xs">{col.name}</span><span className="text-gray-400 text-xs">{col.count}</span></div>
              <div className={`${cardStyle} flex-1 p-3 space-y-2 overflow-y-auto`}>
                {tasks[col.name].map(task => (
                  <div key={task.id} className={`bg-[rgba(30,30,35,0.8)] p-2 rounded border border-white/5 ${style.glow}`}>
                    <div className="flex items-center gap-1.5 mb-1"><span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>{task.assignee && <span className="text-cyan-400 text-[10px] font-mono">{task.assignee}</span>}</div>
                    <p className="text-white text-xs font-medium truncate">{task.title}</p>
                    {task.tags && <div className="flex gap-1 mt-1.5">{task.tags.map(t => <span key={t} className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT */}
      <div className={`w-48 ${cardStyle} m-2 p-4 z-10`}>
        <div className="text-gray-400 text-[10px] font-bold mb-4 flex items-center gap-2"><Activity size={12} /> SCHEDULED</div>
        <div className="space-y-4">{scheduledJobs.map(j => <div key={j.name} className="flex items-center justify-between"><div><p className="text-white text-xs">{j.name}</p><p className="text-gray-500 text-[8px]">{j.freq}</p></div><CircularProgress progress={j.progress} color={j.progress===100?"#00E5FF":"#FF8A00"} /></div>)}</div>
        <div className="mt-auto pt-4 border-t border-white/10"><div className="text-[8px] text-gray-500 text-center">MISSION CONTROL<br/><span className="text-cyan-400">© 2026</span></div></div>
      </div>
    </div>
  );
}
