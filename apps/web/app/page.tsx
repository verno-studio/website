import { env } from "@/env";
import { Story } from "@/components/story";

export const metadata = {
  alternates: { canonical: env.NEXT_PUBLIC_SITE_URL ?? "" },
  description: "Verno Studio",
  openGraph: { url: env.NEXT_PUBLIC_SITE_URL ?? "" },
  title: "Verno Studio",
};

const Home = () => (
  <>
    <Story />
  </>
);

export default Home;
