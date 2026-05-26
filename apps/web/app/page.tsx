import { Story } from "@/components/story";

export const metadata = {
  alternates: { canonical: "/" },
  description:
    "A Next.js monorepo template for DX, UI systems, and design engineering. Ship with taste.",
  openGraph: { url: "/" },
  title: "Verno Studio",
};

const Home = () => (
  <>
    <Story />
  </>
);

export default Home;
