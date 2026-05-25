import { Metadata } from 'next';

export const homeMetadata: Metadata = {
  title: "Home | NXTMUN",
  description: "Welcome to NXTMUN - The premier Model United Nations conference. Register now for the ultimate diplomatic experience.",
  keywords: [
    "NXTMUN",
    "MUN Conference",
    "Model United Nations",
    "Diplomatic Simulation",
    "Student Leadership",
    "International Relations",
    "UN Debate"
  ],
  openGraph: {
    title: "NXTMUN Home | Advanced MUN Platform",
    description: "Welcome to NXTMUN - Join the premier Model United Nations conference for an unforgettable diplomatic experience.",
    url: "https://portal.nxtmun.com",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NXTMUN Conference"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "NXTMUN Home | Advanced MUN Platform",
    description: "Join NXTMUN - The premier Model United Nations conference.",
    images: ["/logo.png"]
  }
};

export const loginMetadata: Metadata = {
  title: "Sign In | NXTMUN",
  description: "Sign in to your NXTMUN account to access the advanced MUN platform, manage your committee assignments, and participate in real-time debates.",
  keywords: [
    "NXTMUN Login",
    "MUN Sign In",
    "NXTMUN Account",
    "Delegate Portal",
    "MUN Platform Access",
    "Conference Login"
  ],
  openGraph: {
    title: "Sign In | NXTMUN",
    description: "Access your NXTMUN account and join the advanced Model United Nations platform.",
    url: "https://portal.nxtmun.com/login",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NXTMUN Login"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | NXTMUN",
    description: "Access your NXTMUN account and join the advanced Model United Nations platform.",
    images: ["/logo.png"]
  }
};

export const registerMetadata: Metadata = {
  title: "Register | NXTMUN",
  description: "Register for NXTMUN - The premier Model United Nations conference. Choose your role, select your committee, and start your diplomatic journey.",
  keywords: [
    "NXTMUN Registration",
    "MUN Register",
    "Model UN Sign Up",
    "Delegate Registration",
    "Chair Application",
    "MUN Conference"
  ],
  openGraph: {
    title: "Register | NXTMUN",
    description: "Register for NXTMUN and join the premier Model United Nations conference.",
    url: "https://portal.nxtmun.com/register",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NXTMUN Registration"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Register | NXTMUN",
    description: "Register for NXTMUN and join the premier Model United Nations conference.",
    images: ["/logo.png"]
  }
};
