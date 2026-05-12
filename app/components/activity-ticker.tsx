"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Lightning, Coins, Megaphone } from "@phosphor-icons/react";

interface Activity {
  id: string;
  type: "PROOF" | "BELIEF" | "CHEER";
  user: string;
  target: string;
  slug: string;
  timestamp: string;
  message: string;
}

export function ActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/activity")
      .then(res => res.json())
      .then(d => {
        if (d.ok) setActivities(d.activities);
      });

    const interval = setInterval(() => {
      setCurrentIndex(prev => (activities.length > 0 ? (prev + 1) % activities.length : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case "PROOF": return <Lightning weight="fill" className="text-oath-gold" />;
      case "BELIEF": return <Coins weight="fill" className="text-blue-500" />;
      case "CHEER": return <Megaphone weight="fill" className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="bg-black text-white h-10 flex items-center overflow-hidden border-b border-white/10 relative">
      <div className="absolute left-0 h-full px-4 bg-black z-10 flex items-center gap-2 border-r border-white/10">
        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Arena Live</span>
      </div>

      <div className="flex-1 overflow-hidden ml-[120px]">
        <div 
          className="flex transition-transform duration-700 ease-in-out h-full items-center"
          style={{ transform: `translateY(-${currentIndex * 100}%)` }}
        >
          {activities.map((activity) => (
            <div key={activity.id} className="h-full flex items-center gap-3 px-4 min-w-full">
              <span className="text-[14px]">{getIcon(activity.type)}</span>
              <p className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                <span className="font-black text-oath-gold uppercase tracking-wider">{activity.user}</span>
                <span className="text-white/60 mx-2">{activity.message}</span>
                <Link href={`/c/${activity.slug}`} className="hover:underline font-bold text-white">
                  {activity.target}
                </Link>
                <span className="text-white/20 ml-3 text-[9px] font-mono">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
