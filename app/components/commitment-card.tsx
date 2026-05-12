import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { CommitmentSummary } from "@/lib/oath-data";
import { 
  Fire, 
  Lightning, 
  Eye, 
  Skull, 
  Users, 
  Coins, 
  Calendar,
  SealCheck
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

type CommitmentCardProps = {
  commitment: CommitmentSummary;
  compact?: boolean;
};

export function CommitmentCard({ commitment, compact = false }: CommitmentCardProps) {
  const isHealthy = !commitment.isAtRisk && commitment.status === "ACTIVE";
  const isFailed = commitment.status === "FAILED";
  const isCompleted = commitment.status === "COMPLETED";

  return (
    <Link href={commitment.publicUrl} className="block h-full">
      <Card className={cn(
        "group relative flex h-full flex-col overflow-hidden border-black/5 bg-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
        isHealthy && "border-l-4 border-l-oath-gold",
        commitment.isAtRisk && "border-l-4 border-l-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
        isCompleted && "border-l-4 border-l-black"
      )}>
        <CardHeader className={compact ? "p-5" : "p-6 pb-2"}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-black/5 border-transparent text-[9px] font-black uppercase tracking-widest text-black/40">
                {commitment.category}
              </Badge>
              {commitment.isAtRisk && (
                <Badge className="bg-red-500 text-white border-transparent text-[9px] font-black uppercase tracking-widest animate-pulse">
                  At Risk
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-black/20 uppercase">
              <Calendar size={12} />
              {commitment.daysRemaining} Days Left
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 group/maker">
              <div className="size-5 rounded-full bg-black/5 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] font-black text-black/20">{commitment.makerName[0]}</span>
              </div>
              <span className="text-xs font-bold text-black/60 group-hover/maker:text-black transition-colors">
                {commitment.makerHandle}
              </span>
              {commitment.makerVerified && <SealCheck size={14} weight="fill" className="text-oath-gold" />}
            </div>
            
            <h3 className="text-xl font-black tracking-tight text-black uppercase leading-tight group-hover:text-oath-gold transition-colors line-clamp-2">
              {commitment.title}
            </h3>
          </div>
        </CardHeader>

        <CardContent className={compact ? "px-5 py-4" : "px-6 py-6"}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-black/20 flex items-center gap-1">
                <Coins size={10} /> Staked
              </p>
              <p className="text-sm font-mono font-black text-black">{commitment.stakeLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-black/20 flex items-center gap-1">
                <Users size={10} /> Believers
              </p>
              <p className="text-sm font-mono font-black text-black">{commitment.believerCount}</p>
            </div>
          </div>

          {/* Social Reaction Strip */}
          <div className="flex items-center gap-3 py-2 px-3 bg-black/[0.02] rounded-xl border border-black/[0.03]">
            <ReactionItem icon={<Fire size={14} weight="fill" />} count={commitment.reactionCounts.momentum} color="text-orange-500" />
            <ReactionItem icon={<Lightning size={14} weight="fill" />} count={commitment.reactionCounts.streak} color="text-yellow-500" />
            <ReactionItem icon={<Eye size={14} weight="fill" />} count={commitment.reactionCounts.watching} color="text-blue-500" />
            <ReactionItem icon={<Skull size={14} weight="fill" />} count={commitment.reactionCounts.doubt} color="text-red-500" />
          </div>
        </CardContent>

        <CardFooter className="mt-auto border-t border-black/5 p-0">
          <div className="w-full flex items-center justify-between px-6 py-4 bg-transparent group-hover:bg-black transition-colors">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 group-hover:text-white/40 transition-colors">
              Day {commitment.proofCount} of {commitment.totalDays}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-oath-gold transition-colors flex items-center gap-2">
              Enter Arena Terminal →
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

function ReactionItem({ icon, count, color }: { icon: React.ReactNode; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono font-black text-black/30">
      <span className={count > 0 ? color : ""}>{icon}</span>
      <span>{count}</span>
    </div>
  );
}
