// docs/15-email-sequence.md — the 7-email soap-opera sequence, transcribed
// verbatim (subjects and bodies are the doc's own compliance-checked copy,
// not paraphrased). `{{URL}}` stands in for the doc's [URL] placeholder and
// is replaced with the app base URL at send time. Bodies are stored as
// paragraph HTML fragments and rendered inside the shared email shell.

export interface SequenceEmail {
  step: number;
  title: string;
  subject: string;
  paragraphs: string[];
}

export const SEQUENCE_EMAILS: SequenceEmail[] = [
  {
    step: 1,
    title: "The Recruitment Lie",
    subject: "You were sold on this business.",
    paragraphs: [
      "So I've been thinking about something.",
      'A producer I\'m working with told me last week that he got into the business eight years ago because someone showed him a whiteboard, penciled out the commission, and said "you can do this." He was 27. He was hungry. He got licensed.',
      "He made it. $100K. $120K. Maybe $140K in a good year.",
      "And then he hit a wall. Not because he wasn't working. Not because he didn't have clients. But because the person who sold him on the opportunity wasn't the person who was going to help him grow it.",
      "That story isn't unique. I've heard it from dozens of producers. The recruitment pitch is real, and the gap between the pitch and the reality is where most agents get stuck.",
      "The reason I'm writing you is because the gap is fixable. Not with more training. Not with another seminar. With a system.",
      "I'll show you what I mean over the next few weeks. No pitch. No pressure. Just a few things I've learned that might shift how you see your own book.",
      "More soon.",
      "— Jay",
      "<strong>P.S.</strong> If you want to skip ahead, the engine I built is at {{URL}}. But I'd rather you hear the whole story first.",
    ],
  },
  {
    step: 2,
    title: "The Invisible Wall",
    subject: "Your upline doesn't have a brain to give you.",
    paragraphs: [
      "Quick one for you today.",
      'When a producer hits $100K, the next question is usually "what do I do now?" And the answer from the industry is usually some version of: get more leads, attend more seminars, watch more training videos, talk to your upline.',
      "Your upline — the BGA, the GA, the MGA — they mean well. They give you a templated website. They offer you a one-pager. They might even make you a video.",
      "But what they don't have is a <strong>brain that thinks like a top producer on every call</strong>.",
      "When you walk into a client meeting, you don't have a case design partner sitting next to you. You're alone. You call the wholesaler, wait two days, get back an illustration, and try to close on the relationship.",
      "The producers at $1M don't have this problem. They have a system. They have a case-design partner. They have a brain that does the strategy work so they can do the relationship work.",
      "That's the invisible wall. The producers who break through have something the producers who don't, don't. And it isn't talent.",
      "It's a system.",
      "More on that next week.",
      "— Jay",
      "<strong>P.S.</strong> The system is software now. I'll show you Tuesday.",
    ],
  },
  {
    step: 3,
    title: "The Epiphany",
    subject: "You don't need more years. You need a brain in your pocket.",
    paragraphs: [
      "Okay, I have to tell you about this.",
      "For the last few months, I've been building something. A strategy engine. The idea is simple: take the case-design thinking that the top 1% of producers do in their head, and put it in software that any producer can use.",
      'You open the app. You type or speak: "I\'ve got a guy." You describe the scenario — ages, health, business structure, what they\'re trying to solve. The engine asks you 10 questions. Then it does the work.',
      "It returns the full case design. The strategies, ranked. The pitch order. The COI actions. The wholesaler handoff. The pitch deck. The commission math.",
      "You walk into the next meeting with everything ready. The next meeting isn't a discovery call. It's a presentation.",
      "This isn't AI inventing strategies on the fly. The engine reasons from a locked, curated library built on real case-design thinking. Every recommendation is non-taxable. Every claim is conditioned on the policy remaining in force. The compliance is built in.",
      "The producers who break through have a system. This is the system. And it's $297/month.",
      "I'll show you the actual output tomorrow.",
      "— Jay",
      "<strong>P.S.</strong> Tomorrow's email has a real \"I've got a guy\" scenario, walked through the engine. If you're skeptical, that's fair. Read it and tell me what you think.",
    ],
  },
  {
    step: 4,
    title: "The 'I've Got a Guy' Moment",
    subject: "I asked Atlas. It returned 5 strategies I would have missed.",
    paragraphs: [
      "Real talk before the weekend.",
      "Here's a real scenario. I made the names up, but the structure is one I see every week.",
      "<em>\"I've got a guy. Two owners, 50 and 49, C-Corp, two key employees, average to good health. Want to set up a buy-sell and put money aside in a company reserve.\"</em>",
      "I typed that into the engine. Atlas asked 10 questions. I answered. Then the engine returned this:",
      "<strong>Strategy stack (in priority order):</strong>",
      "1. <strong>Buy-sell agreement</strong> — funded with survivorship life on both owners. ILIT-owned.<br/>2. <strong>COLI (Corporate Reserve Fund)</strong> — C-Corp purchases corporate-owned life on both owners and the two key employees. §101(j) notice and consent before issue.<br/>3. <strong>§162 Executive Bonus / REBA</strong> — both key employees get a bonus funding personally-owned permanent life, with a 5-year vesting restrictive endorsement. \"Golden handcuffs.\"<br/>4. <strong>Phantom stock</strong> — for the two key employees as a second retention layer.<br/>5. <strong>Estate Funding (Survivorship)</strong> — once the buy-sell is in place, survivorship life on both spouses provides estate liquidity.",
      "<strong>COI action:</strong> \"This needs a CPA in the conversation — the C-Corp's CPA specifically. §162 bonus deductibility, COLI balance-sheet treatment, and AMT exposure all need a CPA sign-off. Do you have a CPA relationship with this client? If not, here's a script to start one.\"",
      "<strong>Wholesaler handoff:</strong> The engine wrote the email to the wholesaler. I clicked send.",
      "<strong>Estimated commission value:</strong> $42,900 in Y1 commission on this scenario.",
      "The whole thing took 60 seconds. The next meeting isn't a discovery call. It's a presentation.",
      "If you're a producer who's been missing opportunities in scenarios like this — and most producers are — the engine finds them.",
      "I'll tell you what to do about it on Tuesday.",
      "— Jay",
      "<strong>P.S.</strong> If you want to see the engine in action, the link is {{URL}}. Try it on a real scenario tonight.",
    ],
  },
  {
    step: 5,
    title: "The False Belief Destroyer",
    subject: "The belief that's keeping you stuck.",
    paragraphs: [
      "Real talk.",
      "I want to name the belief that's keeping most producers stuck at $100K. It's not \"I'm not good enough.\" It's not \"I don't have the right contacts.\" It's this:",
      "<em>\"I need more years, more contacts, more training to break through to $1M.\"</em>",
      "That belief is wrong. And I want to show you why.",
      "The producers at $1M aren't smarter than you. They don't have better contacts. They don't have more training. They have a <strong>system</strong> that you don't have.",
      "The system is a case-design brain. A thinking partner on every call. A thing that knows the strategies, the rules, the pitch order, the COI workflow, the wholesaler handoff. A thing that doesn't get tired, doesn't forget, doesn't make up strategies on the fly.",
      "Once you experience the system, you can't un-experience it. That's why it works. That's why producers who use it break through. Not because they're smarter — because they have a partner that thinks like a top producer.",
      "You don't need more years. You need a brain in your pocket.",
      "— Jay",
      "<strong>P.S.</strong> The brain is software now. $297/month. One found case pays for years of it. Try it.",
    ],
  },
  {
    step: 6,
    title: "The Soft Ask",
    subject: "Want to see what this looks like with your next 'I've got a guy'?",
    paragraphs: [
      "Quick one for you today.",
      "I've been writing about a strategy engine I built. A brain for producers. A system that takes a \"I've got a guy\" scenario and returns the full case design.",
      "I've shown you the strategy stack. The COI workflow. The wholesaler handoff. The false belief that's keeping you stuck.",
      "Here's what I haven't asked: do you want to try it?",
      "If you do, here's what happens:",
      "— You sign up for $297/month<br/>— You run your first \"I've got a guy\" tonight<br/>— The engine returns the full case design<br/>— You see the opportunities sitting in your book that you didn't know were there<br/>— 30 days later, if you didn't find an opportunity, we refund you — no questions asked",
      "That's the offer. No pitch. No pressure. Just a chance to see what's already in your book.",
      "The link is {{URL}}. Try it tonight. Email me the result — I want to see what the engine finds for you.",
      "— Jay",
      "<strong>P.S.</strong> If you're not ready, that's fine. I appreciate you reading this far. The next email will land in a few days.",
    ],
  },
  {
    step: 7,
    title: "The Close",
    subject: "One last thing.",
    paragraphs: [
      "One last thing.",
      "If you've been reading these emails, you know what I'm building. A strategy engine for producers. A brain in your pocket. A system that finds the opportunities already in your book.",
      "You've seen the demo. You've seen the \"I've got a guy\" scenario. You've seen the false belief destroyed.",
      "If you want to try it, the link is {{URL}}. $297/month. 30-day money-back. No questions asked.",
      "If you have questions, reply to this email. I read every reply.",
      "If you're not ready, that's fine. I'll keep writing.",
      "Thanks for reading. Whatever you decide, I hope you find what's sitting in your book.",
      "— Jay",
      "<strong>P.S.</strong> The producers who break through have a system. This is the system. {{URL}}.",
    ],
  },
];

export const SEQUENCE_LENGTH = SEQUENCE_EMAILS.length;
