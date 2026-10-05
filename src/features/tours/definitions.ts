import type { TourId, TourRole } from "./ids";

export type TourStep = {
  anchor?: string | string[];
  title: string;
  body: string;
  roles?: TourRole[];
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

export type TourDefinition = {
  summary: string;
  steps: TourStep[];
  target?: RegExp;
  readyAnchor?: string;
  fallback?: { title: string; body: string };
  finish?: "open-assistant";
};

const stepper = 'nav[aria-label="Load posting steps"]';

export const tourDefinitions: Record<TourId, TourDefinition> = {
  "welcome-shipper": {
    summary: "Where your loads, bids and messages live.",
    steps: [
      { title: "Hi, I'm your AllShip AI assistant", body: "Let me show you around. It takes about a minute, and you can stop any time with Esc." },
      { anchor: "home-loads-summary", title: "Your loads at a glance", body: "Active loads, bids waiting for you and drafts. Select a number to jump straight to that list." },
      { anchor: "home-post-load", title: "Post a load", body: "Tell us what you're shipping and where. Verified carriers usually start bidding within a few hours." },
      { anchor: "nav-loads", title: "Loads", body: "Every load you've posted, with bids as they come in. Drafts wait here until you're ready." },
      { anchor: ["nav-messages", "nav-more"], title: "Messages", body: "Chat with carriers before and after you book. New messages show a badge here." },
      { anchor: "home-setup", title: "Finish setting up", body: "Turn on 2-Step Verification to protect your payments. It takes two minutes." },
      { anchor: "assistant-button", title: "I'm always one tap away", body: "Ask me to draft a load, check your bids or explain a fee. You review everything before it's posted." },
    ],
  },
  "post-load": {
    summary: "The four steps from category to posted load.",
    readyAnchor: "wizard-category-search",
    steps: [
      { title: "Let's post a load", body: "I'm your AllShip AI assistant. Posting takes four short steps, and you can save a draft along the way." },
      { anchor: stepper, title: "Four steps", body: "What you're shipping, the details, the route, then a final review. Finished steps stay clickable so you can go back." },
      { anchor: "wizard-category-search", title: "Find your category", body: "Search for things like car, piano or pallet. Picking a category takes you straight to Details." },
      { anchor: "wizard-category-group", title: "Details that matter", body: "Each category asks only what carriers need to price it, like size, weight or whether a vehicle runs." },
      { anchor: [`${stepper} li:nth-child(3)`, stepper], title: "Your address stays private", body: "On the Route step, bidders only see the city and ZIP area. The exact address goes to the carrier you book." },
      { anchor: "wizard-actions", title: "Save or post", body: "From the Route step on, save a draft any time. On Review, Post load opens it to bids right away." },
      { anchor: "assistant-button", title: "Or let me fill it in", body: "Describe the load in a sentence, like “2 sofas from Austin to Denver next week”, and I'll prefill the form for you to check." },
    ],
  },
  "compare-bids": {
    summary: "Sort bids, check carriers and book with escrow.",
    target: /^\/app\/loads\/(?!new$)[^/]+$/,
    readyAnchor: "bids-panel",
    fallback: {
      title: "No bids to compare yet",
      body: "When carriers bid on one of your open loads, start this tour again and I'll walk you through comparing them.",
    },
    steps: [
      { title: "Let's pick a carrier", body: "I'm your AllShip AI assistant. Here's how to compare the bids on this load and book with confidence." },
      { anchor: "bids-panel", title: "Every bid in one place", body: "Each bid shows the carrier's price, pickup and delivery dates, rating and a note on how they'll handle the job." },
      { anchor: "bids-sort", title: "Sort to compare", body: "Switch between lowest price, top rated and earliest pickup. The lowest bid is tagged for you." },
      { anchor: "bid-card", title: "Check the carrier", body: "Look for FMCSA verified, reviews and completed loads. The message usually covers equipment and insurance." },
      { anchor: "bid-accept", title: "Accept and pay", body: "You'll see the total with the service fee before paying. Your money stays in escrow until you confirm delivery." },
      { anchor: ["nav-messages", "nav-more"], title: "Questions first?", body: "Message a carrier before you accept. Your exact address stays hidden until you book." },
    ],
  },
  "welcome-carrier": {
    summary: "Find loads, track bids and run your trips.",
    steps: [
      { title: "Hi, I'm your AllShip AI assistant", body: "Let me show you around. It takes about a minute, and you can stop any time with Esc." },
      { anchor: "home-marketplace", title: "Your marketplace", body: "Open loads, bids waiting on shippers and loads you've won, updated as things change." },
      { anchor: "nav-board", title: "Find loads", body: "Browse open loads from US shippers and filter by what you haul and where." },
      { anchor: "nav-bids", title: "Bids", body: "Every bid you've placed. Update or withdraw while bidding is open." },
      { anchor: "nav-trips", title: "Trips", body: "Loads you win land here. Assign a driver before the pickup window." },
      { anchor: ["nav-team", "nav-more"], roles: ["owner"], title: "Your team", body: "Invite drivers and dispatchers. On a phone, Team, Payouts and Reviews are under More." },
      { anchor: "home-setup", title: "Finish setup to bid", body: "We check your USDOT and MC with FMCSA and connect Stripe payouts before your first bid." },
      { anchor: "assistant-button", title: "I'm always one tap away", body: "Ask me which loads fit your lanes or to draft a bid. You review it before anything is sent." },
    ],
  },
  "load-board": {
    summary: "Filters, sorting and reading a load card.",
    readyAnchor: "board-filters",
    steps: [
      { title: "Let's find your next load", body: "I'm your AllShip AI assistant. Here's how to narrow the board down to loads that fit your trucks." },
      { anchor: "board-filters", title: "Filter by what you haul", body: "Pick categories and pickup or delivery states. Filters are saved in the link, so you can bookmark a lane." },
      { anchor: "board-sort", title: "Sort the list", body: "Newest first, earliest pickup or highest target price." },
      { anchor: "board-load-card", title: "A load at a glance", body: "Route, pickup window, key details and the shipper's target. The timer shows when bidding closes." },
      { anchor: "nav-bids", title: "Keep track of your bids", body: "Everything you've bid on, split into active, won and closed." },
    ],
  },
  "place-bid": {
    summary: "Price, dates and a message shippers trust.",
    target: /^\/app\/board\/[^/]+$/,
    readyAnchor: "bid-panel",
    fallback: {
      title: "No open loads right now",
      body: "New loads are posted throughout the day. Open any load and start this tour again to walk through bidding.",
    },
    steps: [
      { title: "Let's write a bid that wins", body: "I'm your AllShip AI assistant. I'll point out what shippers look at when they choose a carrier." },
      { anchor: "board-route", title: "Check the route and dates", body: "City and state only for now. Full addresses and contacts unlock once you're booked." },
      { anchor: ["bid-amount", "bid-panel"], title: "Name your price", body: "Enter what you want for the whole job. Shippers compare it with the target and other bids." },
      { anchor: "bid-breakdown", title: "You keep 100%", body: "The service fee is added on top for the shipper. You're paid your full bid once delivery is confirmed." },
      { anchor: "bid-message", title: "Say why you're the right fit", body: "Mention your equipment, insurance and what's included. At least 80 characters, and specific beats generic." },
      { anchor: "bid-submit", title: "Send it", body: "You can update or withdraw while bidding is open. We'll notify you when the shipper decides." },
      { anchor: "assistant-button", title: "Want a first draft?", body: "Ask me to draft a bid for this load. I'll suggest a price and message you can edit before posting." },
    ],
  },
  team: {
    summary: "Invite people and manage roles.",
    readyAnchor: "team-invite",
    steps: [
      { title: "Let's build your team", body: "I'm your AllShip AI assistant. Here's how to bring your drivers and dispatchers into AllShip." },
      { anchor: "team-invite", title: "Invite by email", body: "Choose Driver or Dispatcher and send a link. Drivers only see the trips you assign to them." },
      { anchor: "team-members", title: "People", body: "Change someone's role or remove them. Active trips are listed next to each person." },
      { anchor: "team-pending", title: "Pending invitations", body: "Invites that haven't been accepted yet. Resend one if it got lost, or cancel it." },
      { anchor: "nav-trips", title: "Assign drivers to trips", body: "Open a booked trip and pick a driver. They get the full addresses and pickup window." },
    ],
  },
  "welcome-driver": {
    summary: "Where your assigned trips live.",
    readyAnchor: 'nav[aria-label="Trip status"]',
    steps: [
      { title: "Hi, I'm your AllShip AI assistant", body: "Let me show you where your trips live and how to stay in touch on the road." },
      { anchor: 'nav[aria-label="Trip status"]', title: "Upcoming, Active, Done", body: "New assignments start in Upcoming. They move to Active when you head to pickup." },
      { anchor: "trips-list", title: "Open a trip", body: "Select a trip for addresses, the pickup window and your next step." },
      { anchor: "nav-messages", title: "Messages", body: "Reach your dispatcher or the shipper without leaving the app." },
      { anchor: "nav-settings", title: "Keep your phone current", body: "Shippers and receivers call the number in your profile on delivery day." },
      { anchor: "assistant-button", title: "Ask me on the road", body: "Ask what's next on a trip or where to find a document. I'll answer in plain words." },
    ],
  },
  "trip-driver": {
    summary: "Next steps, location sharing and proof of delivery.",
    target: /^\/app\/trips\/[^/]+$/,
    readyAnchor: "trip-stops",
    fallback: {
      title: "No trips assigned yet",
      body: "When your dispatcher assigns you a load, start this tour again and I'll walk you through it from pickup to delivery.",
    },
    steps: [
      { title: "Let's run a trip", body: "I'm your AllShip AI assistant. Here's every step from pickup to proof of delivery." },
      { anchor: "trip-next-step", title: "Your next step", body: "One button for what's next: start the trip, confirm pickup, then confirm delivery." },
      { anchor: "trip-location", title: "Share your location", body: "Turn this on while you drive so the shipper and dispatcher can follow the load. It stops when the trip ends." },
      { anchor: "trip-stops", title: "Stops", body: "Full addresses, time windows and contacts for pickup and delivery." },
      { anchor: "trip-photos", title: "Photos and proof of delivery", body: "Take photos at pickup, then a delivery photo and the receiver's signature. They're all saved here." },
      { anchor: "trip-help", title: "Something wrong?", body: "Message the shipper or your dispatcher right from the trip." },
    ],
  },
  assistant: {
    summary: "What I can do and how to ask.",
    finish: "open-assistant",
    steps: [
      { title: "Hi, I'm your AllShip AI assistant", body: "I answer questions, find things in your account and draft loads or bids for you." },
      { anchor: "assistant-button", title: "Open me from any page", body: "I can see which page you're on, so you can ask about it directly." },
      { roles: ["shipper"], title: "Ask in plain words", body: "Try “Which of my loads have new bids?” or “Post a load: my 2019 Civic from Austin to Denver.”" },
      { roles: ["owner", "dispatcher"], title: "Ask in plain words", body: "Try “Find car loads out of Texas” or “Draft a bid for this load.”" },
      { roles: ["driver"], title: "Ask in plain words", body: "Try “What's my next pickup?” or “How do I add a delivery photo?”" },
      { title: "You stay in control", body: "I only read your data. When I draft something, you review it before anything is posted or sent." },
      { title: "Let's try it", body: "Select Done and I'll open so you can ask your first question." },
    ],
  },
};
