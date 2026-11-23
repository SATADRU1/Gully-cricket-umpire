import { motion } from 'framer-motion';

/** Big two-line page title. The second line sits on a tilted lime sticker. */
export default function Headline({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-[clamp(3.5rem,16vw,9rem)] font-extrabold leading-[0.95] tracking-tight"
    >
      <span className="block">{line1}</span>
      <span className="mt-2 inline-block -rotate-2 rounded-2xl border-2 border-ink bg-accent px-4 pb-2 text-black shadow-[6px_6px_0_0_var(--ink)]">
        {line2}
      </span>
    </motion.h1>
  );
}