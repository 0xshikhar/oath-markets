export function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(223,255,0,0.08),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(19,19,19,0.03),transparent_26%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(19,19,19,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(19,19,19,0.05)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(circle_at_center,black,transparent_74%)]" />
      <div className="absolute inset-x-0 top-0 h-[20rem] bg-[linear-gradient(180deg,rgba(223,255,0,0.06)_0%,rgba(255,255,255,0)_100%)]" />
    </div>
  );
}
