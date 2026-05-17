"use client";

import { useState } from "react";
import { VoteStepper } from "./VoteStepper";
import { useVote } from "@/contexts/VoteContext";
import { VOTE_PRICE_NAIRA, isFreeCategory } from "@/lib/awards.config";
import type { CategoryConfig } from "@/lib/awards.config";

interface CategoryCardProps {
  category: CategoryConfig;
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState<string | null>(null);
  const { addVote, removeVote, getVotesForNominee } = useVote();
  const isFree = isFreeCategory(category.id);

  const activeNominee = selectedNominee
    ? category.nominees.find((n) => n.id === selectedNominee)
    : null;

  const handleNomineeClick = (nomineeId: string) => {
    const votes = getVotesForNominee(category.id, nomineeId);
    
    if (isFree) {
      if (votes > 0) {
        removeVote(category.id, nomineeId);
        setSelectedNominee(null);
      } else {
        const nominee = category.nominees.find(n => n.id === nomineeId);
        if (nominee) {
          addVote(category.id, nominee.id, nominee.name, category.name);
          setSelectedNominee(nomineeId);
        }
      }
    } else {
      setSelectedNominee(nomineeId === selectedNominee ? null : nomineeId);
      if (votes === 0) {
        const nominee = category.nominees.find(n => n.id === nomineeId);
        if (nominee) {
          addVote(category.id, nominee.id, nominee.name, category.name);
        }
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="cat-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="cat-label">
          <span className="cat-num">{String(index + 1).padStart(2, "0")}</span>
          {category.name}
          {isFree && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Free</span>}
        </div>
        <i className={`ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"} cat-chevron`} />
      </div>

      {isOpen && (
        <div>
          {category.nominees.map((nominee, i) => {
            const votes = getVotesForNominee(category.id, nominee.id);
            return (
              <div
                key={nominee.id}
                className="arow"
                onClick={() => handleNomineeClick(nominee.id)}
              >
                <span className="arow-idx">{String(i + 1).padStart(2, "0")}</span>

                <div className="arow-body">
                  <div className="arow-name">{nominee.name}</div>
                  {votes > 0 && (
                    <div className="arow-meta">
                      {isFree ? "Voted" : `${votes} vote${votes !== 1 ? "s" : ""}`}
                    </div>
                  )}
                </div>

                {votes > 0 ? (
                  <div className="arow-check on">
                    <i className="ti ti-check" style={{ fontSize: 12 }} />
                  </div>
                ) : (
                  <span className="arow-chev">
                    <i className="ti ti-chevron-right" />
                  </span>
                )}
              </div>
            );
          })}

          {activeNominee && !isFree && (
            <div className="mt-3 mb-4 animate-scale-in">
              <VoteStepper
                votes={getVotesForNominee(category.id, activeNominee.id)}
                nomineeName={activeNominee.name}
                costPerVote={VOTE_PRICE_NAIRA}
                onAdd={() => addVote(category.id, activeNominee.id, activeNominee.name, category.name)}
                onRemove={() => removeVote(category.id, activeNominee.id)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
