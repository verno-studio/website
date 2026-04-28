import Link from "next/link";

const NotFound = () => (
  <div className="flex flex-col gap-4">
    <h1 className="text-balance font-normal font-serif text-3xl text-foreground sm:text-5xl">
      Page not found
    </h1>
    <p className="text-muted-foreground">
      The page you&apos;re looking for doesn&apos;t exist.{" "}
      <Link href="/" className="text-foreground underline">
        Go home
      </Link>
      .
    </p>
  </div>
);

export default NotFound;
