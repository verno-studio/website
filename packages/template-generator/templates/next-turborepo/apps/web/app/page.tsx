const Home = () => (
  <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4 py-16">
    <h1 className="text-3xl font-semibold tracking-tight">{{ projectName }}</h1>
    <p className="text-neutral-600">
      Edit{" "}
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm dark:bg-neutral-800">
        app/page.tsx
      </code>{" "}
      to get started.
    </p>
  </main>
);

export default Home;
