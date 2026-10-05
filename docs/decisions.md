# Open decisions

Items the code currently handles with a placeholder or a conservative default. Each needs a business or legal decision.

| # | Topic | Current behavior | Where |
|---|---|---|---|
| 1 | Carrier fee | Carriers receive 100% of their bid; only the shipper pays the 10% fee (`PLATFORM_FEE_BPS=1000`). The old site mentioned a 5.5% carrier dispatch fee; the dispatch page says the fee is agreed separately and does not show a number. | `/carriers`, `/carriers/dispatch`, `/pricing`, blog "How carriers win more loads" |
| 2 | Legal texts | Fresh drafts marked "Draft — pending legal review" on every page. Invented terms that need sign-off: late-cancellation fee (10% of carrier price, max $250) after the 48-hour cutoff, data retention periods, Delaware courts. A lawyer should also confirm whether AllShip needs FMCSA broker registration for this model. | `/legal/*` |
| 3 | Calculator rates | Moving and car-shipping calculators use our own working rate assumptions, printed on the page and labeled as rough estimates. Replace with real bid data once loads exist. | `src/components/marketing/tools/*-math.ts` |
| 4 | Truck rental model | Truck rental = a truck with the carrier's driver booked for a day or longer; truck with driver = hourly. No self-drive rentals. | `/truck-rental`, `/truck-with-driver`, categories |
| 5 | Support hours | Not published anywhere until real hours exist. | `/contact` |
| 6 | Sample UI | Mock screens on marketing pages use example amounts and load IDs, each labeled "Example". | home, `/how-it-works`, `/carriers`, `/ai` |
| 7 | Payment timeout | Accepted bid waits 30 minutes for payment, then the load reopens (from architecture.md). | `/how-it-works` |
