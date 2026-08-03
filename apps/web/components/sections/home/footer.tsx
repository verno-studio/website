import { PunGrumpyIcon } from "@/components/icons/pungrumpy";
import Link from "next/link";

export const Footer = () => (
  <footer className="inline-block text-pretty text-gray-900 mt-4 @sm:mt-12">
    Built by{" "}
    <a
      className="text-gray-900 underline decoration-1 decoration-gray-900/50 underline-offset-2 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-gray-1000"
      href="https://www.pungrumpy.com"
      rel="noopener noreferrer"
      target="_blank"
    >
      <PunGrumpyIcon className="mr-1 mb-0.5 inline-block size-3" />
      Noppakorn Kaewsalabnil
    </a>
    , focusing on the invisible details that make software feel great. The template is the product.
    See what shipped in{" "}
    <Link
      className="text-gray-900 underline decoration-gray-900/50 underline-offset-2 decoration-1 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-gray-1000"
      href="/updates"
    >
      updates
    </Link>
    .
  </footer>
);
