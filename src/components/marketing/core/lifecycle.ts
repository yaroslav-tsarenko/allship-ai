export type LifecycleStep = { id: string; title: string; short: string; who: string };

export const lifecycle: LifecycleStep[] = [
  { id: "post", title: "Post the shipment", short: "Pickup, delivery, dates and what is moving. Photos help carriers price it.", who: "You" },
  { id: "bids", title: "Verified carriers bid", short: "Only carriers with active USDOT and MC authority, insurance and a payout account can bid.", who: "Carriers" },
  { id: "pay", title: "Accept a bid and pay", short: "You pay the bid plus the 10% service fee. Stripe holds it in escrow.", who: "You" },
  { id: "pickup", title: "Pickup", short: "The driver confirms pickup in the app and uploads photos of the load.", who: "Driver" },
  { id: "delivery", title: "Delivery", short: "Proof of delivery: a photo and your signature at drop-off.", who: "Driver" },
  { id: "release", title: "Confirm and release", short: "You confirm, or it confirms itself after 72 hours. Then the carrier is paid.", who: "You" },
];
