import { Story } from "@/components/story";

export const metadata = {
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}` },
  description: "Verno Studio",
  openGraph: { url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}` },
  title: "Verno Studio",
};

const Home = () => (
  <>
    <Story />
  </>
);

export default Home;
