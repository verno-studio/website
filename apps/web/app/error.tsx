"use client";

const Error = () => (
  <div className="flex flex-col gap-4">
    <h1 className="text-balance font-normal font-serif text-3xl text-foreground sm:text-5xl">
      Something went wrong
    </h1>
    <p className="text-muted-foreground">
      An unexpected error occurred. Please try refreshing the page.
    </p>
  </div>
);

export default Error;
