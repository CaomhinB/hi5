import type { DiscoveryProfile } from "./discoveryProfile";
import sarahHeadshot from "./Sarah_Cheng_Headshot.png";

export type { DiscoveryProfile, SkillTone } from "./discoveryProfile";

// Demo data only. The UI also accepts image URLs for future profile data.
export const mockProfiles: DiscoveryProfile[] = [
  {
    id: "sarah-cheng",
    name: "Sarah Cheng",
    verified: true,
    professionalTitle: "Product Marketing Manager",
    location: "London, UK",
    industry: "Early-stage SaaS",
    experience: "5+ yrs",
    biography:
      "I help turn complex products into clear stories. Currently focused on B2B SaaS and growth marketing.",
    skills: [
      { label: "Marketing", tone: "blue" },
      { label: "SaaS", tone: "cyan" },
      { label: "Growth", tone: "purple" },
      { label: "Startups", tone: "pink" },
    ],
    whyThisProfile:
      "You both work in SaaS, are interested in growth marketing and open to collaboration.",
    image: sarahHeadshot,
    placeholderTone: "blue",
  },
  {
    id: "alex-rivera",
    name: "Alex Rivera",
    verified: true,
    professionalTitle: "Full-stack Developer",
    location: "Bristol, UK",
    industry: "Climate tech",
    experience: "6+ yrs",
    biography:
      "Building practical tools for a greener future. Looking for thoughtful people to turn a side project into something useful.",
    skills: [
      { label: "Engineering", tone: "blue" },
      { label: "Climate", tone: "cyan" },
      { label: "Side projects", tone: "purple" },
      { label: "Startups", tone: "pink" },
    ],
    whyThisProfile:
      "You both enjoy building useful products and are open to collaborating on an early-stage idea.",
    image: null,
    placeholderTone: "blue",
  },
  {
    id: "maya-ellis",
    name: "Maya Ellis",
    verified: false,
    professionalTitle: "Product Designer",
    location: "Manchester, UK",
    industry: "Health tech",
    experience: "4+ yrs",
    biography:
      "Making complex experiences feel simple and human. Keen to meet builders who care about accessible, thoughtful design.",
    skills: [
      { label: "Design", tone: "purple" },
      { label: "Research", tone: "blue" },
      { label: "Accessibility", tone: "cyan" },
      { label: "Collaboration", tone: "pink" },
    ],
    whyThisProfile:
      "You share an interest in user-focused products and could bring complementary skills to a new project.",
    image: null,
    placeholderTone: "purple",
  },
  {
    id: "noah-bennett",
    name: "Noah Bennett",
    verified: true,
    professionalTitle: "Startup Strategy Mentor",
    location: "Edinburgh, UK",
    industry: "Early-stage ventures",
    experience: "10+ yrs",
    biography:
      "Helping small teams find their next clear step. Happy to exchange ideas on positioning, growth and building a sustainable business.",
    skills: [
      { label: "Strategy", tone: "blue" },
      { label: "Mentoring", tone: "cyan" },
      { label: "Growth", tone: "purple" },
      { label: "Founders", tone: "pink" },
    ],
    whyThisProfile:
      "You are both interested in sustainable growth, and Noah is open to sharing his experience with other builders.",
    image: null,
    placeholderTone: "teal",
  },
];
