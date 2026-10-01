"use client";

import { useState } from "react";

const tabs = [
  {
    id: "builders",
    label: "Co-founders & builders",
    title: "Have an idea but need someone to build it with?",
    body: [
      "Hi5 helps founders find people with complementary skills, interests, and ambitions.",
      "Whether you're looking for a technical co-founder, business co-founder, designer, early team member, or someone to explore an idea with, you can make that intention clear on your profile.",
      "Instead of sending dozens of cold messages, discover people who are also actively looking for opportunities to build.",
    ],
  },
  {
    id: "collaborators",
    label: "Collaborators",
    title: "Not every connection needs to start with a job offer.",
    body: [
      "Maybe you're building an app. Starting a business. Launching a creative project. Running an experiment. Exploring a new idea.",
      "Hi5 helps you discover people who are open to collaborating, and lets both sides decide whether the conversation is worth starting.",
    ],
  },
  {
    id: "mentors",
    label: "Mentors",
    title: "Sometimes the best connection is someone a few steps ahead.",
    body: [
      "Use Hi5 to meet experienced professionals who are open to sharing knowledge, offering feedback, or mentoring others.",
      "Mentors stay in control of who they speak with, while mentees can find people whose experience actually matches what they want to learn. Because both people choose the connection, the conversation starts with shared interest.",
    ],
  },
  {
    id: "researchers",
    label: "Researchers",
    title: "Great ideas don't always stay inside one discipline.",
    body: [
      "Students, graduates, researchers, academics, and industry professionals can use Hi5 to discover people working on related problems.",
      "Find people by their research interests, expertise, methods, technologies, and collaboration goals. Your next research partner might be working on the same problem from a completely different perspective.",
    ],
  },
  {
    id: "inperson",
    label: "In person",
    title: "Some connections are better face to face.",
    body: [
      "Set your meeting preferences so other people know how you're open to connecting. Coffee nearby? A quick video call? A meetup after work? Remote collaboration across countries?",
      "You decide. Hi5 can help you discover people locally, or connect with professionals further away when location doesn't matter.",
    ],
  },
];

export function FindTabs() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div className="find">
      <div className="find-list" role="tablist" aria-label="Who you can find">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={i === active}
            className={`find-tab ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="find-num">0{i + 1}</span>
            {t.label}
          </button>
        ))}
      </div>
      <div key={tab.id} className="find-panel glass glass-strong" role="tabpanel">
        <h3>{tab.title}</h3>
        {tab.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}
