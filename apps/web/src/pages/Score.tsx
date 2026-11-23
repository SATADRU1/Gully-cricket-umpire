import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { content } from '../content';
import { useStore } from '../lib/store';

export default function Home() {
  const match = useStore((s) => s.match);
  return (
    <div className="pt-8">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-[clamp(3.5rem,16vw,9rem)] font-extrabold leading-[0.85] tracking-tight"
      >
        {content.home.title1}
        <br />
        <span className="bg-accent px-2 text-black">{content.home.title2}</span>
      </motion.h1>
      <p className="mt-6 max-w-xl text-xl font-medium">{content.home.subtitle}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {match && (
          <Link to="/match" className="btn btn-accent text-lg">
            {content.home.resume}: {match.setup.teams[0].name} vs {match.setup.teams[1].name}
          </Link>
        )}
        <Link to="/new" className="btn btn-ink text-lg">
          {content.home.newMatch}
        </Link>
        <Link to="/stats" className="btn text-lg">
          {content.home.stats}
        </Link>
      </div>
    </div>
  );
}