"use client";

import { motion } from "framer-motion";
import { TEXTS } from "@/constants/texts";

export default function Features() {
  const features = [
    { 
      title: TEXTS.en.home.features.createWorkouts.title, 
      description: TEXTS.en.home.features.createWorkouts.description 
    },
    { 
      title: TEXTS.en.home.features.trackProgress.title, 
      description: TEXTS.en.home.features.trackProgress.description 
    },
    { 
      title: TEXTS.en.home.features.videoGuides.title, 
      description: TEXTS.en.home.features.videoGuides.description 
    },
  ];

  return (
    <section className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 bg-black text-white px-4 py-32">
      {features.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: i * 0.3 }}
          className="bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-xl max-w-sm text-center"
        >
          <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
          <p className="text-gray-300">{feature.description}</p>
        </motion.div>
      ))}
    </section>
  );
}
