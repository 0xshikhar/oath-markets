"use client";

import { Users, SealCheck } from "@phosphor-icons/react";
import Image from "next/image";

interface Believer {
  walletAddress: string;
  handle: string;
  avatarUrl: string | null;
  stakeLabel: string;
}

interface BelieversListProps {
  believers: Believer[];
  totalCount: number;
}

export function BelieversList({ believers, totalCount }: BelieversListProps) {
  if (totalCount === 0) {
    return (
      <div className="p-8 text-center bg-black/[0.02] rounded-[2rem] border border-dashed border-black/10">
        <Users size={32} className="mx-auto mb-3 text-black/10" />
        <p className="text-[10px] font-black uppercase tracking-widest text-black/30">
          No believers yet
        </p>
        <p className="text-xs font-medium text-black/20 mt-1">
          Be the first to stake your faith in this oath.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
          <Users size={14} weight="fill" /> Believers ({totalCount})
        </h3>
        {totalCount > 10 && (
          <span className="text-[9px] font-black uppercase tracking-widest text-oath-gold bg-black px-2 py-0.5 rounded-full">
            Top 10
          </span>
        )}
      </div>

      <div className="grid gap-2">
        {believers.map((believer) => (
          <div 
            key={believer.walletAddress}
            className="flex items-center justify-between p-3 bg-white rounded-2xl border border-black/5 hover:border-oath-gold transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-black/5 flex items-center justify-center overflow-hidden border border-black/5">
                {believer.avatarUrl ? (
                  <Image src={believer.avatarUrl} alt={believer.handle} width={32} height={32} className="size-full object-cover" />
                ) : (
                  <span className="text-xs font-black text-black/20">{believer.handle[1]}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black group-hover:text-oath-gold transition-colors flex items-center gap-1">
                  {believer.handle}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-black/30">
                  Staked {believer.stakeLabel}
                </span>
              </div>
            </div>
            <SealCheck size={16} weight="fill" className="text-black/5 group-hover:text-oath-gold transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
