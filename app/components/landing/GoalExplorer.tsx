"use client";

import { useState } from "react";

const goals = [
  { id: "cofounder", icon: "🚀", label: "A co-founder", text: "Find someone with complementary skills to build your next startup with." },
  { id: "collab", icon: "🤝", label: "A collaborator", text: "Meet people who want to team up on a side project, experiment or new idea." },
  { id: "mentor", icon: "🎓", label: "A mentor", text: "Learn from someone a few steps ahead. Mentors stay in control of who they speak with." },
  { id: "build", icon: "🏗️", label: "A business partner", text: "Find someone to build a business with, not just a name on a list." },
  { id: "investor", icon: "💼", label: "An investor", text: "Meet investors who are interested in what you are creating." },
  { id: "research", icon: "🔬", label: "A researcher", text: "Discover people working on a similar problem, from a different angle." },
  { id: "freelance", icon: "🛠️", label: "A specialist", text: "Find a freelancer or expert with the exact skills you need." },
  { id: "industry", icon: "🧭", label: "A way into a new industry", text: "Meet people who can help you make the jump into a new field." },
  { id: "local", icon: "📍", label: "People nearby", text: "Find professionals close to you who are open to meeting in person." },
  { id: "curious", icon: "✨", label: "Interesting people", text: "Simply meet interesting people working on interesting things." },
];

export function GoalExplorer() {
  const [active, setActive] = useState(goals[0].id);
  const goal = goals.find((g) => g.id === active) ?? goals[0];

  return (
    <div className="goals">
      <div className="goal-chips" role="tablist" aria-label="Networking goals">
        {goals.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={g.id === active}
            className={`goal-chip ${g.id === active ? "active" : ""}`}
            onClick={() => setActive(g.id)}
          >
            <span>{g.icon}</span>
            {g.label}
          </button>
        ))}
      </div>
      <div key={goal.id} className="goal-panel glass glass-strong" role="tabpanel">
        <span className="goal-panel-icon">{goal.icon}</span>
        <div>
          <p className="goal-panel-label">I&apos;m looking for</p>
          <h3>{goal.label}</h3>
          <p>{goal.text}</p>
        </div>
      </div>
      <p className="goals-note">Your goals can change, and your Hi5 changes with them.</p>
    </div>
  );
}
