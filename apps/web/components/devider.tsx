export const Divider = () => (
  <div aria-hidden className="my-16 flex items-center justify-center gap-1.5">
    {[0, 1, 2, 3, 4, 5].map((dash) => (
      <span className="h-0.5 w-4 rounded-full bg-gray-400" key={dash} />
    ))}
  </div>
);
