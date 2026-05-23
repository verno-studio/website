import { Hero } from "@/components/hero";
import { Story } from "@/components/story";

export const metadata = {
  description: "Verno Studio",
  title: "Verno Studio",
};

const Home = () => (
  <>
    <Hero />
    <Story />
  </>
);

export default Home;
