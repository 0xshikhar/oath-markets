export function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,224,0,0.07),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.035),transparent_26%)]" />
      <div className="absolute inset-0 opacity-22 [background-image:linear-gradient(to_right,rgba(183,224,0,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(183,224,0,0.07)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]" />
      <div className="absolute inset-x-0 top-0 h-[22rem] bg-[linear-gradient(180deg,rgba(183,224,0,0.07)_0%,rgba(13,14,10,0)_100%)]" />
    </div>
  );
}
