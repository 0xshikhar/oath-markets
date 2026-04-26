export function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,166,35,0.18),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_28%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(245,166,35,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,166,35,0.08)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]" />
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[linear-gradient(180deg,rgba(245,166,35,0.16)_0%,rgba(9,9,11,0)_100%)]" />
      <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-oath-gold/10 blur-3xl" />
      <div className="absolute right-0 top-52 h-80 w-80 rounded-full bg-oath-blue/10 blur-3xl" />
    </div>
  );
}
