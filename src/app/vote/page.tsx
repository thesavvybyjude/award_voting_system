"use client";

import { awardsConfig } from "@/lib/awards.config";
import { CategoryCard } from "@/components/CategoryCard";
import { FloatingBar } from "@/components/FloatingBar";
import { ScreenHeader } from "@/components/Header";
import { VotingDeadlineBanner, useVotingEnded } from "@/components/VotingDeadlineBanner";
import { VotingEndedScreen } from "@/components/VotingEndedScreen";

export default function VotePage() {
  const votingEnded = useVotingEnded();

  if (votingEnded) return <VotingEndedScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <VotingDeadlineBanner />
      <ScreenHeader title="Awards" subtitle="Select nominees & add votes" />

      <div className="scroll-area px-5 pb-28">
        {awardsConfig
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
      </div>

      <FloatingBar />
    </div>
  );
}

