import type { ToolKey } from "@/components/marketing/services/next-steps";
import type { LoadCategory } from "@/server/db/schema/enums";

export type CategoryNeedGroup = { title: string; items: string[] };
export type CategoryFaq = { question: string; answer: string };
export type CategoryGlance = { label: string; value: string };

export type CategoryDetail = {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  serviceType: string;
  intro: string;
  glance: CategoryGlance[];
  needs: CategoryNeedGroup[];
  prep: string[];
  faqs: CategoryFaq[];
  related: LoadCategory[];
  tools: ToolKey[];
};

const escrowAnswer =
  "You pay the accepted bid plus the 10% AllShip service fee, and Stripe holds it in escrow. The carrier is paid after you confirm delivery, or automatically 72 hours after delivery if you have not opened a dispute.";

export const categoryDetails: Record<LoadCategory, CategoryDetail> = {
  local_moving: {
    h1: "Local movers who bid on your whole move",
    metaTitle: "Local Movers: Compare Bids from Verified Carriers",
    metaDescription: "Post a local move under 50 miles with home size, stairs and dates. FMCSA-verified movers bid, and your payment stays in escrow until the job is done.",
    serviceType: "Local moving",
    intro:
      "Local moves are usually priced on crew size and hours, so the details that add time matter most: how many bedrooms, how many flights of stairs at each end and how far the truck parks from the door. Post them once and verified movers nearby bid on the whole job.",
    glance: [
      { label: "Usually priced on", value: "Crew, hours and truck size" },
      { label: "Distance", value: "Same metro area, under about 50 miles" },
      { label: "Plan ahead", value: "Elevator bookings and parking at both ends" },
    ],
    needs: [
      { title: "The home", items: ["Type of residence: house, apartment, condo or other", "Number of bedrooms, from studio to 4 or more"] },
      { title: "Access", items: ["Stories at pickup: 1, 2 or 3 and up", "Stories at delivery", "Elevators, long walks from the truck or tight stairwells, in the notes"] },
      { title: "Extras worth mentioning", items: ["Items that need two or more people: pianos, safes, large appliances", "Anything the crew should take apart and reassemble"] },
    ],
    prep: [
      "Measure your largest pieces and the narrowest doorway or stair turn on the way out, and note anything that has to come apart.",
      "Ask both buildings about elevator reservations, loading zones and whether movers must provide a certificate of insurance, then add the answers to your post.",
      "Pack and label boxes by room before the crew arrives. On an hourly job, time spent waiting for packing is time you pay for.",
      "Set aside documents, valuables, medication and first-night essentials, and carry them yourself.",
      "Empty, unplug and defrost the refrigerator and freezer at least a day before the move.",
    ],
    faqs: [
      {
        question: "How are local moves usually priced?",
        answer:
          "Most local movers charge by the hour for a crew and truck, sometimes with a minimum and a travel charge. On AllShip each mover bids a total for the job you posted, so you compare prices side by side. You pay the accepted bid plus the 10% AllShip service fee.",
      },
      {
        question: "What counts as a local move?",
        answer: "AllShip treats moves within the same metro area, under about 50 miles, as local. Longer and interstate moves belong under long-distance moving, where volume and distance drive the price.",
      },
      {
        question: "Do I need to be there on moving day?",
        answer: "You or someone you trust should be at pickup and delivery to let the crew in, show them what goes and check items before the crew leaves. You confirm delivery in AllShip once everything is inside.",
      },
      {
        question: "What if the job turns out bigger than posted?",
        answer: "Describe stairs, long carries and heavy pieces in the post so bids match the real job. If the scope changes on the day, agree on the change with the mover in the AllShip chat before work continues.",
      },
      {
        question: "Are the movers insured?",
        answer: "Every carrier shows proof of insurance and passes a USDOT and MC check with FMCSA before it can bid. Ask the mover in chat what its coverage includes, especially for high-value items.",
      },
    ],
    related: ["long_distance_moving", "household_items", "heavy_lifting", "truck_with_driver"],
    tools: ["moving-cost", "cubic-feet"],
  },

  long_distance_moving: {
    h1: "Long-distance moving, priced on your volume",
    metaTitle: "Long-Distance Movers: Bids Based on Your Volume",
    metaDescription: "Post an interstate move with home size, packing level and storage needs. Verified long-distance movers bid on the same scope; payment waits in escrow.",
    serviceType: "Long-distance moving",
    intro:
      "Interstate and cross-country moves are priced mainly on how much you ship and how far it goes. AllShip converts your home size into an estimated volume in cubic feet and adds the packing, unpacking and storage you choose, so every mover bids on the same scope.",
    glance: [
      { label: "Usually priced on", value: "Volume or weight, and distance" },
      { label: "Starting volume", value: "300 ft³ for 1 bedroom to 2,600 ft³ for 8" },
      { label: "Plan ahead", value: "Book weeks ahead for summer dates" },
    ],
    needs: [
      {
        title: "Size of the move",
        items: ["Number of bedrooms, which sets the starting volume: 300 ft³ for 1 bedroom, 600 for 2, 950 for 3, 1,300 for 4", "Your own cubic-feet count or inventory list, if you have one"],
      },
      { title: "Services", items: ["Packing: full (100%), half (50%) or a quarter (25%) of your belongings", "Unpacking at the new home", "Storage, and for how many months"] },
      { title: "Access and special items", items: ["Stairs or elevator at each end", "Pianos, safes, artwork, gym equipment or anything else that needs special handling"] },
    ],
    prep: [
      "Start early. Long-distance carriers plan routes weeks ahead, and summer weekends and month-end dates fill first.",
      "Count your furniture room by room with the cubic feet calculator. The closer your volume is to reality, the fewer changes at pickup.",
      "Sell or donate what you won't use. On a long-distance move every cubic foot rides the whole way.",
      "Ask each mover for a delivery window and whether your goods ride on a dedicated truck or share one with other shipments.",
      "Look up the mover's USDOT number on FMCSA's site and keep the \"Your Rights and Responsibilities When You Move\" booklet interstate movers must give you.",
    ],
    faqs: [
      {
        question: "What is the difference between released value and full value protection?",
        answer:
          "Interstate movers must offer both. Released value protection comes at no extra charge but limits the mover's liability to 60 cents per pound per article. Full value protection costs more and makes the mover responsible for repairing, replacing or paying the current value of lost or damaged items, under the mover's terms.",
      },
      {
        question: "How do movers estimate a long-distance move?",
        answer: "Most estimate from weight or volume plus distance. AllShip uses your bedroom count as a starting volume, for example about 950 ft³ for three bedrooms, and carriers bid on that. An inventory list and photos make bids more accurate.",
      },
      {
        question: "Can my things go into storage between homes?",
        answer: "Yes. Turn on storage in your post and say how many months you need. Movers include it in their bid or share their monthly rate in chat.",
      },
      {
        question: "How long does a cross-country move take?",
        answer: "It depends on distance, season and whether your load has its own truck. Each bid includes the carrier's pickup and delivery estimate, so you can compare timing alongside price.",
      },
      { question: "When does the mover get paid?", answer: escrowAnswer },
    ],
    related: ["local_moving", "military_moving", "corporate_relocation", "household_items"],
    tools: ["moving-cost", "cubic-feet"],
  },

  household_items: {
    h1: "Ship furniture and household items",
    metaTitle: "Furniture and Household Item Delivery by Verified Carriers",
    metaDescription: "Ship a sofa, a dresser or a washer without moving your whole home. Post each item with size and access details and compare bids from verified carriers.",
    serviceType: "Furniture and household item delivery",
    intro:
      "Not moving the whole home? Post the sofa you sold, the dresser you bought across town or the washer going to your new place, and carriers heading that way bid on just those pieces. The more exactly you describe each item, the more exact the bids.",
    glance: [
      { label: "Usually priced on", value: "Item size, weight, stairs and distance" },
      { label: "Typical equipment", value: "Blankets, straps, a two-person crew" },
      { label: "Plan ahead", value: "Measurements and a photo of each item" },
    ],
    needs: [
      { title: "Where it's coming from", items: ["Type of residence: house, apartment, condo, mobile home or other", "Number of bedrooms, if part of a home is moving", "Total number of boxes: 1–5, 6–10, 11–20, 21–50 or more"] },
      { title: "What's moving", items: ["Large furniture: bed, sofa, dresser, wardrobe, dining table, TV stand, desk", "Appliances: refrigerator, washer and dryer, microwave, dishwasher, oven", "Fragile items, and anything needing special handling: antiques, glass, electronics, musical instruments"] },
      { title: "Extras", items: ["Packing and unpacking", "Furniture disassembly and reassembly", "Storage", "Extra moving supplies"] },
    ],
    prep: [
      "Photograph each item and add its measurements. Carriers use them to decide whether it fits and whether it needs two people.",
      "Empty drawers, take out glass shelves and tabletops, and tape doors shut with painter's tape so the finish isn't damaged.",
      "Unplug a refrigerator early enough to defrost and dry it, and fit transit bolts to a front-load washer if you still have them.",
      "Bag and label screws from anything you take apart and tape the bag to the piece.",
      "If the item is upstairs or behind a long walk, say so. It changes the crew and the price.",
    ],
    faqs: [
      { question: "Can I ship a single piece of furniture?", answer: "Yes. Post one item or several. Describe size and weight so carriers can tell whether it fits alongside their other loads." },
      { question: "Do carriers wrap furniture?", answer: "Many bring moving blankets and stretch wrap. If something needs crating, such as glass or an antique, mark it under special handling so carriers can price it." },
      {
        question: "Can the carrier pick up from a store or a private seller?",
        answer: "Yes. Use the store or seller's address as pickup and add the order number or pickup instructions in the details. Make sure the item is paid for and released before the pickup date.",
      },
      {
        question: "What if something arrives damaged?",
        answer: "Inspect items before you confirm delivery. If something is damaged, open a dispute instead of confirming; the payment stays in escrow while the dispute is reviewed.",
      },
    ],
    related: ["local_moving", "heavy_lifting", "truck_with_driver", "student_moving"],
    tools: ["cubic-feet", "pricing"],
  },

  office_moving: {
    h1: "Office moving planned around your workdays",
    metaTitle: "Office Movers: Workstations, IT and After-Hours Moves",
    metaDescription: "Post your office move with square footage, workstations, equipment and after-hours needs. Verified commercial movers bid; payment is held until delivery.",
    serviceType: "Office moving",
    intro:
      "An office move is measured in workstations and working hours. Tell carriers how big the space is, how many desks and machines move and whether the job has to happen after hours or on a weekend, and they bid on a plan that fits your schedule.",
    glance: [
      { label: "Usually priced on", value: "Square footage, workstations and equipment" },
      { label: "Timing", value: "After hours or weekends to avoid downtime" },
      { label: "Plan ahead", value: "Freight elevator, dock and insurance certificates" },
    ],
    needs: [
      {
        title: "The space",
        items: ["Type of office: small office, corporate office, co-working space, retail store, warehouse", "Total square footage: under 500, 500–1,000, 1,000–5,000 or 5,000+ sq ft", "Number of workstations or desks, from 1–5 to 50+", "Number of large furniture items"],
      },
      { title: "Equipment", items: ["Computers, printers, copiers, phones and servers", "Items needing special handling: IT equipment, server racks, glass partitions, electronics, heavy machinery", "Whether anything fragile is moving"] },
      { title: "Extras", items: ["Packing and unpacking", "Furniture disassembly and reassembly", "Storage", "After-hours or weekend moving", "Extra moving supplies"] },
    ],
    prep: [
      "Book the freight elevator and loading dock at both buildings, and ask both property managers what insurance certificate movers must provide.",
      "Number every desk and label its furniture, boxes and equipment to match. Attach the new floor plan to your post.",
      "Have IT back up data and photograph cable layouts, and decide who disconnects and reconnects computers, phones and servers.",
      "Check your lease before listing copiers and large printers; leasing companies often require their own technicians to move them.",
      "Give staff a deadline to pack personal items and clear desks the day before.",
    ],
    faqs: [
      { question: "Can the move happen after hours or on a weekend?", answer: "Yes. Turn on after-hours or weekend moving in the form, and carriers who work those hours will bid with that schedule." },
      {
        question: "Will movers reconnect computers and the network?",
        answer: "Movers move the equipment; reconnecting networks is usually done by your IT team or vendor. If you need setup help, say so in the details, or post the job as a corporate relocation, which includes IT and network setup as an option.",
      },
      { question: "How do I describe the size of the move?", answer: "The form uses three measures carriers understand: a square footage range, the number of workstations and the number of large furniture items. A floor plan or photos help even more." },
      { question: "How does payment work for a business?", answer: escrowAnswer },
    ],
    related: ["business_moving", "corporate_relocation", "heavy_lifting", "freight"],
    tools: ["cubic-feet", "pricing"],
  },

  business_moving: {
    h1: "Business and retail moving",
    metaTitle: "Commercial Movers for Retail, Restaurants and Warehouses",
    metaDescription: "Move a store, restaurant or warehouse with fixtures, stock and equipment. Post floor levels and special needs, then compare bids from verified movers.",
    serviceType: "Commercial moving",
    intro:
      "Stores, restaurants and warehouses move with fixtures, stock and equipment that don't fit a household checklist. Post the location type, the square footage, what's heavy and which floor everything is on, and carriers bid on the actual job instead of a guess.",
    glance: [
      { label: "Usually priced on", value: "Square footage, heavy equipment and floors" },
      { label: "Typical equipment", value: "Pallet jacks, liftgates, dollies" },
      { label: "Plan ahead", value: "Utility disconnects and a stock count" },
    ],
    needs: [
      { title: "The location", items: ["Type of business: office, retail store, warehouse, restaurant or other", "Total square footage: under 500, 500–1,000, 1,000–5,000 or 5,000+ sq ft"] },
      { title: "What's moving", items: ["Number of workstations or desks", "Number of large equipment items: 0–2, 3–5, 6–10 or 11+", "Special needs: IT equipment, server racks, filing cabinets, fragile items, heavy machinery"] },
      { title: "Access", items: ["Floor level at pickup and delivery: ground, 1, 2, 3+ with an elevator or 3+ without one"] },
    ],
    prep: [
      "Count stock before the move and pack it in labeled, same-size boxes or on pallets so it can be checked at both ends.",
      "Have gas, water and drain lines on restaurant equipment disconnected by a licensed technician before moving day.",
      "Empty filing cabinets that will go up or down stairs, and move the files in boxes.",
      "Tell customers and suppliers your closing dates and new address in advance.",
      "Note whether each site has a working elevator or loading dock. It changes the crew size and the time on site.",
    ],
    faqs: [
      { question: "What kinds of businesses can post a move?", answer: "Offices, retail stores, warehouses, restaurants and other commercial spaces. For a large multi-site or headquarters move, use corporate relocation instead." },
      {
        question: "Can carriers move palletized inventory?",
        answer: "Yes. Say how many pallets and their size; carriers with liftgates and pallet jacks can bid. Regular shipments between locations are better posted as freight.",
      },
      {
        question: "Can you move heavy machinery?",
        answer: "Mark heavy machinery as a special need and give the make, model and weight. Machines that need a trailer, rigging or permits should be posted as heavy equipment.",
      },
      { question: "What does the 10% service fee cover?", answer: "It is AllShip's fee for the marketplace, carrier verification and escrow payment through Stripe. It is added on top of the carrier's bid, which goes to the carrier." },
    ],
    related: ["office_moving", "corporate_relocation", "freight", "heavy_equipment"],
    tools: ["freight-class", "pricing"],
  },

  corporate_relocation: {
    h1: "Corporate relocation on one schedule",
    metaTitle: "Corporate Relocation Movers for Offices and Multi-Site Moves",
    metaDescription: "Plan a headquarters or multi-site move with workstations, server racks, security rules and IT setup in one post. Compare plans from verified carriers.",
    serviceType: "Corporate relocation",
    intro:
      "Moving a headquarters, a call center or several sites at once means dozens of workstations, cubicle systems, server racks and access rules. The corporate form captures all of it in one post, so carriers bid on the full project and you compare plans instead of making phone calls.",
    glance: [
      { label: "Usually priced on", value: "Workstations, equipment, crew days" },
      { label: "Typical scope", value: "Phased moves by floor or department" },
      { label: "Plan ahead", value: "Security rules and a single coordinator" },
    ],
    needs: [
      {
        title: "The space",
        items: ["Type of space: office building, tech hub, call center, retail chain, manufacturing facility", "Square footage: under 1,000, 1,000–5,000, 5,000–10,000 or 10,000+ sq ft", "Workstations, meeting rooms and conference tables, partitions and cubicles"],
      },
      { title: "Equipment and security", items: ["Large office equipment count", "IT racks, large servers, heavy machinery, high-security equipment", "Fragile or high-value items", "Whether security clearance is needed"] },
      {
        title: "Extras",
        items: ["IT and network setup assistance", "Packing, unpacking, disassembly and reassembly", "Short- or long-term storage", "After-hours or weekend work", "Additional security and insurance coverage", "Specialized packing for high-value items"],
      },
    ],
    prep: [
      "Name one move coordinator who answers carrier questions and signs off at each site.",
      "Map every workstation, meeting room and cubicle to its new location before bids come in.",
      "List access rules: badges, escorts, background checks and restricted rooms.",
      "Decide how sensitive records and drives travel: locked containers, a documented chain of custody or your own staff.",
      "Move in phases by department or floor so the rest of the company keeps working.",
    ],
    faqs: [
      {
        question: "Can one post cover several sites?",
        answer: "Add stops in the location step for multiple pickups or drop-offs on one route. For moves on different dates, post each site separately so carriers can bid on each one.",
      },
      { question: "Can carriers help with IT and network setup?", answer: "Turn on IT and network setup assistance, then confirm in chat exactly what the carrier's team will connect and test." },
      {
        question: "What if our buildings require extra insurance?",
        answer: "Turn on additional security and insurance coverage and list the certificates your buildings require. Carriers confirm in their bid or in chat what they can provide.",
      },
      { question: "How are employees' household moves handled?", answer: "Post each employee's home move as its own local or long-distance move, so each one has its own bid, schedule and payment." },
    ],
    related: ["office_moving", "business_moving", "long_distance_moving", "military_moving"],
    tools: ["pricing", "cubic-feet"],
  },

  student_moving: {
    h1: "Student moving for dorms and first apartments",
    metaTitle: "Student Movers for Dorms, Apartments and Summer Storage",
    metaDescription: "Move out of a dorm or into a first apartment on a fixed date. Post your boxes and big items, add summer storage if needed, and compare carrier bids.",
    serviceType: "Student moving",
    intro:
      "A student move is small but tied to a fixed date: move-out day, the end of a lease or the start of the semester. Post your boxes and the few big pieces, pick the date that works with your school and carriers bid on the job, including summer storage if you need it.",
    glance: [
      { label: "Usually priced on", value: "Box count, large items and distance" },
      { label: "Timing", value: "Dorm move-in and move-out windows" },
      { label: "Plan ahead", value: "Book before end-of-term weeks" },
    ],
    needs: [
      { title: "The room", items: ["Type of residence: dormitory, shared apartment, studio or other", "Size: shared room, studio, 1 or 2 bedrooms", "Total boxes: 1–5, 6–10, 11–20 or more"] },
      { title: "Large items and electronics", items: ["Bed, desk, chair, dresser, bookshelf, mini-fridge, TV", "Laptop, desktop PC, monitor, gaming console, speakers", "Fragile items, and whether furniture needs assembly or disassembly"] },
      { title: "Extras", items: ["Packing and unpacking", "Temporary storage", "Moving supplies", "Help with heavy lifting", "Last-minute or emergency move"] },
    ],
    prep: [
      "Check move-in and move-out windows with your housing office; many dorms assign time slots and limit where trucks can park.",
      "Count boxes honestly. The box count is how carriers size the vehicle.",
      "Pack electronics in their original boxes if you kept them, or wrap them in clothes and towels.",
      "Defrost and dry the mini-fridge at least a day before pickup.",
      "Moving with roommates to the same place? Post one job with everyone's items.",
    ],
    faqs: [
      { question: "Can my things go into storage over the summer?", answer: "Yes. Turn on temporary storage and say how long you need it. Carriers include storage in their bid or tell you their monthly rate in chat." },
      { question: "Can a parent book and pay for the move?", answer: "Yes. Whoever creates the post pays into escrow. Add the student's contact details in the notes so the carrier can coordinate on the day." },
      { question: "What if I need to move at the last minute?", answer: "Turn on last-minute move so carriers know the timing. Fewer carriers may be free on short notice, so post as soon as you know the date." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["household_items", "local_moving", "truck_with_driver", "long_distance_moving"],
    tools: ["cubic-feet", "moving-cost"],
  },

  military_moving: {
    h1: "Military moving for PCS, retirement and deployment",
    metaTitle: "Military Movers for PCS, PPM and Retirement Moves",
    metaDescription: "Post a PCS, retirement or personally procured move with household size, pro-gear and paperwork needs. Verified carriers bid; payment is held in escrow.",
    serviceType: "Military moving",
    intro:
      "Service members can move with government-arranged movers or arrange the move themselves as a personally procured move (PPM). For a PPM, items outside your entitlement or a retirement move, post it here: carriers bid on your household, gear and paperwork needs.",
    glance: [
      { label: "Move types", value: "PCS, TDY, deployment, retirement" },
      { label: "Usually priced on", value: "Household size, volume and distance" },
      { label: "Plan ahead", value: "Ask your transportation office what records you need" },
    ],
    needs: [
      { title: "The move", items: ["Type of move: PCS, temporary duty (TDY), deployment, retirement or other", "Household size: single, couple, family with 1–2 or 3+ children", "Number of bedrooms and total boxes", "Fragile or high-value items"] },
      { title: "What's moving", items: ["Large furniture: bed, sofa, dining table, wardrobe, desk, dresser, bookshelves", "Appliances: refrigerator, washer and dryer, microwave, dishwasher, oven", "Military items: uniforms and gear, storage containers, a safe, and firearms with proper documentation"] },
      { title: "Extras", items: ["Packing, unpacking, disassembly and reassembly", "Temporary or long-term storage", "Special packing for gear or sensitive documents", "Expedited moving", "Help with move paperwork"] },
    ],
    prep: [
      "Talk to your installation's transportation office before booking. Your orders decide what is covered and which documents a reimbursement needs.",
      "Keep orders, receipts and weight tickets in one folder, and attach the files carriers need to see to your post.",
      "Separate professional gear from household goods and label it, since it is often recorded separately.",
      "Firearms must travel unloaded and locked under federal, state and installation rules. Confirm the carrier accepts them before you accept a bid.",
      "Plan for storage if housing at the new duty station isn't ready when you arrive.",
    ],
    faqs: [
      {
        question: "Is this the same as a government-arranged move?",
        answer: "No. AllShip is a marketplace where you hire a carrier directly. It suits personally procured moves, items outside your entitlement and retirement moves. For a government-arranged move, work with your transportation office.",
      },
      {
        question: "Can carriers provide weight tickets for a PPM?",
        answer: "Turn on paperwork assistance and say which documents you need. Ask in chat whether the carrier can provide certified weight tickets and itemized receipts before you accept a bid.",
      },
      { question: "Can firearms be moved?", answer: "Only with proper documentation and only with a carrier that agrees to it. Mark firearms in the form and confirm in chat before accepting a bid." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["long_distance_moving", "local_moving", "household_items", "corporate_relocation"],
    tools: ["moving-cost", "cubic-feet"],
  },

  heavy_lifting: {
    h1: "Heavy lifting help, without the truck",
    metaTitle: "Hire Movers for Heavy Lifting, Loading and Unloading",
    metaDescription: "Need a crew but no truck? Post pianos, safes, appliances or a rental truck to load, with weights and stairs, and compare bids from verified local crews.",
    serviceType: "Moving labor",
    intro:
      "Sometimes you don't need transport, just strong hands: a piano up two flights, a safe into the basement or a rental truck loaded before noon. Post what needs moving, how heavy it is and how far it goes, and crews bid on the labor alone.",
    glance: [
      { label: "Usually priced on", value: "Item weight, count, floors and crew size" },
      { label: "Typical equipment", value: "Dollies, straps, hoists" },
      { label: "Plan ahead", value: "Measure doorways and stair turns" },
    ],
    needs: [
      { title: "The items", items: ["Type: furniture, appliances, safes, pianos, gym equipment, industrial machinery", "Estimated weight per item: under 100, 100–250, 250–500 or 500+ lbs", "Number of heavy items: 1–2, 3–5, 6–10 or more"] },
      { title: "The path", items: ["Floor level at both ends, and whether an elevator is available", "Distance: same room, same floor, between floors, between buildings within 100 ft or farther"] },
      { title: "Extras", items: ["Disassembly and reassembly", "Moving equipment: dollies, straps, hoists", "Additional crew members", "Emergency or same-day help"] },
    ],
    prep: [
      "Measure doorways, stair width and turns along the path and compare them with the item's dimensions.",
      "Look up the weight in the manual or on the maker's site; for a safe or piano, the model number is usually enough.",
      "Clear the path, protect floors and warn the crew about rugs, tight landings or fresh paint.",
      "Take weight plates off gym equipment and drain fountains or aquariums before the crew arrives.",
      "If you rented a truck or container, have it parked and open when the crew arrives.",
    ],
    faqs: [
      { question: "Can a crew load my rental truck or moving container?", answer: "Yes. Use the truck's location as the address, list what's going in and say which floor it comes from. The crew loads; you drive." },
      {
        question: "Can you move a piano?",
        answer: "Choose pianos as the item type and give the kind (upright, baby grand or grand) and the floors involved. Grand pianos are usually moved on their side on a piano board, so mention tight turns.",
      },
      { question: "What equipment do crews bring?", answer: "Most bring dollies and straps. If the job needs a hoist, a stair climber or extra hands, turn on moving equipment or additional crew so it's priced into the bid." },
      { question: "Can I get help the same day?", answer: "Turn on emergency or same-day help. Whether someone can come depends on crews nearby, so post as early as you can." },
    ],
    related: ["household_items", "local_moving", "truck_with_driver", "heavy_equipment"],
    tools: ["pricing", "cubic-feet"],
  },

  car_or_light_truck: {
    h1: "Car shipping on open or enclosed carriers",
    metaTitle: "Car Shipping Quotes: Open and Enclosed Auto Transport",
    metaDescription: "Ship a car, SUV or pickup on an open or enclosed carrier. Post year, make, model and condition, compare verified carrier bids and pay through escrow.",
    serviceType: "Auto transport",
    intro:
      "To quote a car, carriers need the year, make and model, whether it runs and which trailer you want. Convertibles, modified vehicles and cars that don't run load differently, so the form asks about those too.",
    glance: [
      { label: "Usually priced on", value: "Distance, vehicle size, trailer type" },
      { label: "Typical equipment", value: "Open car hauler or enclosed trailer" },
      { label: "Plan ahead", value: "Photos of every side at pickup" },
    ],
    needs: [
      { title: "The vehicle", items: ["Year, make and model", "Convertible: soft tops are best shipped enclosed", "Modified: lifted, lowered or with parts that change its size", "Inoperable: if it doesn't run, the carrier needs a winch"] },
      { title: "Trailer type", items: ["Open trailer", "Enclosed trailer", "Either, to get both kinds of bids"] },
    ],
    prep: [
      "Wash the car, then photograph every side, the roof and the odometer at pickup. These photos are your record of its condition.",
      "Remove toll tags, personal items and loose accessories like bike racks.",
      "Leave about a quarter tank of fuel: enough to drive on and off the trailer without extra weight.",
      "Turn off the alarm or explain to the driver how to, and hand over one set of keys.",
      "For a car that doesn't run, say whether it rolls, steers and brakes.",
      "Inspect the car with the driver at delivery before you sign or confirm delivery in AllShip.",
    ],
    faqs: [
      {
        question: "Open or enclosed transport: which should I choose?",
        answer:
          "Open carriers are the most common way to ship cars and usually cost less, but the car is exposed to weather and road debris. Enclosed trailers protect it fully and suit classic, exotic or freshly restored cars, at a higher price. Choose either to get both kinds of bids.",
      },
      { question: "Can you ship a car that doesn't run?", answer: "Yes. Mark it inoperable so only carriers with a winch bid, and say whether it rolls, steers and brakes." },
      { question: "Can I pack things in the trunk?", answer: "Ask the carrier first. Personal belongings are generally not covered by a carrier's cargo insurance, and extra weight counts against the truck's limits." },
      { question: "How long does car shipping take?", answer: "It depends on distance and how the carrier's route is planned. Each bid includes estimated pickup and delivery dates, so you can compare timing alongside price." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["motorcycle", "commercial_truck", "trailer", "rv"],
    tools: ["car-shipping", "pricing"],
  },

  motorcycle: {
    h1: "Motorcycle shipping",
    metaTitle: "Motorcycle Shipping: Enclosed, Open or Crated Transport",
    metaDescription: "Ship a street bike, cruiser, trike or dirt bike with verified carriers. Post year, make, model and condition, compare bids and pay through escrow.",
    serviceType: "Motorcycle transport",
    intro:
      "Bikes ship strapped down in enclosed trailers, on open carriers with wheel chocks, or crated. Carriers need the year, make and model, whether it runs, and whether it's a trike, has a sidecar or has custom parts, since each changes how it is secured.",
    glance: [
      { label: "Usually priced on", value: "Distance, bike size, enclosed or open" },
      { label: "Typical equipment", value: "Wheel chocks and soft tie-downs" },
      { label: "Plan ahead", value: "Remove bags and loose accessories" },
    ],
    needs: [
      { title: "The bike", items: ["Year, make and model", "Operable: runs and drives", "Sidecar attached", "Trike: three wheels", "Modified: custom parts or changes from stock"] },
    ],
    prep: [
      "Photograph both sides of the bike and note existing scratches.",
      "Remove saddlebags, GPS units, covers and anything that could come loose.",
      "Run the tank low and check for leaks.",
      "Tell the driver if the battery is weak, and hand over or disable the alarm fob.",
      "Point out custom parts that stick out; they need room when the bike is strapped.",
    ],
    faqs: [
      { question: "Should I crate my motorcycle?", answer: "Crating protects the bike but adds cost and work at both ends. Many riders ship uncrated in an enclosed trailer, strapped to wheel chocks. Ask carriers which they offer." },
      { question: "Can you ship a trike or a bike with a sidecar?", answer: "Yes. Mark it in the form; both are wider than a standard bike and need more room on the trailer." },
      { question: "Can I ship a motorcycle that doesn't run?", answer: "Yes. Turn off operable and say whether it rolls and the brakes work, so carriers bring the right help to load it." },
      { question: "What about ATVs and dirt bikes?", answer: "Dirt bikes ship here. ATVs, UTVs and snowmobiles have their own category with dimension fields that suit them better." },
    ],
    related: ["atv_powersports", "car_or_light_truck", "trailer", "vehicle_parts"],
    tools: ["car-shipping", "pricing"],
  },

  powerboat: {
    h1: "Powerboat transport",
    metaTitle: "Boat Transport for Powerboats, On or Off a Trailer",
    metaDescription: "Ship a powerboat on its own trailer or a carrier's boat trailer. Post length, beam, height and weight to get accurate bids from verified boat haulers.",
    serviceType: "Boat transport",
    intro:
      "A powerboat on its own trailer can be towed by a carrier with the right truck; one without a trailer rides on a carrier's hydraulic boat trailer. Either way, carriers price on length, beam, height on the trailer and weight, so measure these before you post.",
    glance: [
      { label: "Usually priced on", value: "Length, beam, weight and distance" },
      { label: "Typical equipment", value: "Your trailer or a hydraulic boat trailer" },
      { label: "Plan ahead", value: "Height including T-top or arch" },
    ],
    needs: [
      { title: "Dimensions", items: ["Weight in pounds, with engines and fuel as shipped", "Overall length in feet, including swim platform and outboard", "Beam (width) at the widest point", "Height from the ground on the trailer, to the highest point"] },
      { title: "Trailer", items: ["Already on its own trailer or not"] },
    ],
    prep: [
      "Measure overall length, beam and height on the trailer, including any T-top, arch, radar or antenna.",
      "If the boat travels on its own trailer, check tires, bearings, lights and tie-down straps.",
      "Drain water, run the fuel low and disconnect the batteries.",
      "Remove or secure canvas, biminis, electronics and loose gear; canvas can tear at highway speed.",
      "Raise and secure the outboard or outdrive in its trailering position.",
    ],
    faqs: [
      {
        question: "Does a wide boat need a permit?",
        answer: "Boats wider than 8.5 feet usually exceed the standard legal width and need oversize permits, which vary by state; wider loads may also need escort vehicles. Carriers who move oversize boats arrange permits for their route, so check that the cost is in the bid.",
      },
      { question: "My boat has no trailer. Can it still ship?", answer: "Yes. Turn off \"on trailer\" and carriers with hydraulic boat trailers will bid. Plan for a lift or crane at the marina or yard at both ends if the boat is in the water." },
      { question: "Why does height matter so much?", answer: "Bridges, overpasses and state height limits decide the route. Lower or remove T-tops, arches and antennas where you can, and give the height with the boat on its trailer." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["sailboat", "personal_watercraft", "trailer", "rv"],
    tools: ["pricing"],
  },

  sailboat: {
    h1: "Sailboat transport with the mast down",
    metaTitle: "Sailboat Transport: Mast, Keel and Trailer Details",
    metaDescription: "Ship a sailboat with the mast unstepped on a cradle or hydraulic trailer. Post length, beam, keel height and weight, then compare verified carrier bids.",
    serviceType: "Sailboat transport",
    intro:
      "Sailboats travel with the mast unstepped and strapped alongside the hull, on a cradle or hydraulic trailer that supports the keel. To bid, carriers need the make, length, beam and weight, the height with the mast down and whether the boat is already on its own trailer.",
    glance: [
      { label: "Usually priced on", value: "Length, beam, keel height and weight" },
      { label: "Typical equipment", value: "Hydraulic boat trailer with keel support" },
      { label: "Plan ahead", value: "Mast unstepped and a lift booked at both ends" },
    ],
    needs: [
      { title: "The boat", items: ["Boat make", "Number of boats in the shipment"] },
      { title: "Dimensions", items: ["Weight in pounds, keel included", "Length overall in feet", "Beam at the widest point", "Height from the bottom of the keel to the highest fixed point with the mast down", "Mast length, so carriers can plan how it rides alongside"] },
      { title: "Trailer", items: ["Already on its own trailer or not"] },
    ],
    prep: [
      "Arrange for the yard to unstep the mast, remove the boom and take off the sails, unless the carrier offers rigging work.",
      "Pad and tie the mast, spreaders and standing rigging so nothing chafes, and label shrouds and stays for re-rigging.",
      "Remove or secure winch handles, instruments, cushions and anything loose on deck.",
      "Measure keel-to-top height carefully. Keel boats often reach state height limits before anything else.",
      "Book the travel lift or crane at both marinas for the pickup and delivery dates.",
    ],
    faqs: [
      { question: "Who unsteps the mast?", answer: "Usually the boatyard or a rigger at the departure marina. Some carriers offer it; if you want them to, say so in the details so it is priced into the bid." },
      {
        question: "Is my sailboat an oversize load?",
        answer: "If the beam is over 8.5 feet, or the height on the trailer is above the state limit, the move needs oversize permits, which vary by state. Keel boats often hit the height limit first.",
      },
      { question: "Can a carrier move a boat without its own trailer?", answer: "Yes. Carriers with hydraulic trailers support the keel and hull directly. You'll need a lift or crane at both ends to get the boat out of and into the water." },
      { question: "Can I ship more than one boat?", answer: "Yes. Set the number of boats; small daysailers and dinghies can often share a trailer." },
    ],
    related: ["powerboat", "personal_watercraft", "trailer", "heavy_equipment"],
    tools: ["pricing"],
  },

  personal_watercraft: {
    h1: "Jet ski and personal watercraft shipping",
    metaTitle: "Jet Ski Shipping: Single or Pairs, On or Off a Trailer",
    metaDescription: "Ship one or two jet skis on your own trailer or a carrier's. Post the make, quantity, dimensions and weight, compare verified carrier bids and pay safely.",
    serviceType: "Personal watercraft transport",
    intro:
      "Personal watercraft are light enough to ship one or two at a time, on their own trailer or loaded onto a carrier's flatbed or enclosed trailer. Carriers need the make, how many you have, each unit's dimensions and weight and whether they're on a trailer.",
    glance: [
      { label: "Usually priced on", value: "Quantity, dimensions and distance" },
      { label: "Typical equipment", value: "Your trailer, a flatbed or enclosed trailer" },
      { label: "Plan ahead", value: "Flush and drain after salt water" },
    ],
    needs: [
      { title: "The watercraft", items: ["Make", "Number of units"] },
      { title: "Dimensions", items: ["Weight in pounds", "Length, width and height in inches or feet"] },
      { title: "Trailer", items: ["On its own trailer or not, and whether it's a single or double trailer"] },
    ],
    prep: [
      "Flush and drain the cooling system, especially after salt water, and run the fuel low.",
      "Keep the lanyard key with your paperwork and hand it to the driver at pickup.",
      "Secure seats and hatches; take out ropes, fenders and life jackets.",
      "If it ships on your trailer, check the tires, lights, winch strap and bunks.",
      "Photograph the hull and note scratches before pickup.",
    ],
    faqs: [
      { question: "Can I ship two jet skis together?", answer: "Yes. Set the quantity to two and say whether they're on a double trailer." },
      { question: "Do I need my own trailer?", answer: "No. Turn off \"on trailer\" and carriers will load the craft onto their own equipment." },
      { question: "Can it ship in an enclosed trailer?", answer: "Ask in the details. Enclosed space protects the hull and seats from weather and road debris and is usually priced higher." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["powerboat", "atv_powersports", "sailboat", "trailer"],
    tools: ["pricing"],
  },

  atv_powersports: {
    h1: "ATV, UTV and snowmobile shipping",
    metaTitle: "ATV, UTV and Side-by-Side Shipping with Verified Carriers",
    metaDescription: "Ship ATVs, UTVs, side-by-sides and snowmobiles. Post quantity, dimensions and weight with accessories fitted, compare verified bids and pay via escrow.",
    serviceType: "Powersports transport",
    intro:
      "ATVs, side-by-sides and snowmobiles ship on flatbeds, in enclosed trailers or on their own trailer. Because sizes vary so much, carriers ask for the quantity plus each machine's length, width, height and weight, measured with racks, plows and winches fitted.",
    glance: [
      { label: "Usually priced on", value: "Quantity, footprint, weight and distance" },
      { label: "Typical equipment", value: "Flatbed, enclosed trailer or your trailer" },
      { label: "Plan ahead", value: "Measure with accessories installed" },
    ],
    needs: [
      { title: "The machines", items: ["Quantity"] },
      { title: "Dimensions", items: ["Weight in pounds", "Length, width and height, with accessories fitted"] },
      { title: "Trailer", items: ["Already on a trailer or not"] },
    ],
    prep: [
      "Measure with racks, plows, winches and roofs installed, or remove them and list them separately.",
      "Close the fuel valve if there is one, and check for oil and coolant leaks.",
      "Remove loose bags, coolers and anything that could fall off at speed.",
      "Show the driver how to put it in neutral and release the parking brake.",
      "Photograph each machine from all sides before pickup.",
    ],
    faqs: [
      { question: "Can you ship side-by-sides and UTVs?", answer: "Yes. They're wider and heavier than most ATVs, so give exact dimensions and weight; some only fit on a flatbed or a wide trailer." },
      { question: "Can several machines go together?", answer: "Yes. Set the quantity and, if sizes differ, list each machine in the details." },
      { question: "What if it doesn't run?", answer: "Say so in the details, and whether it rolls and steers. Carriers will bring a winch or ramps that suit it." },
      { question: "Can snowmobiles ship without a trailer?", answer: "Yes. Carriers load them on flatbeds or in enclosed trailers; mention whether skis or tracks need protection." },
    ],
    related: ["motorcycle", "personal_watercraft", "trailer", "vehicle_parts"],
    tools: ["car-shipping", "pricing"],
  },

  commercial_truck: {
    h1: "Commercial truck transport",
    metaTitle: "Commercial Truck Transport: Box Trucks, Tractors and Vans",
    metaDescription: "Move box trucks, tractors and work vans on a trailer, towed or driven. Post year, make, model and trailer preference, then compare verified carrier bids.",
    serviceType: "Commercial truck transport",
    intro:
      "Box trucks, tractors, work vans and service bodies move three ways: on a trailer, towed or driven by a professional driver. Tell carriers the year, make, model and how many, and add a trailer preference if your truck needs a step deck or lowboy.",
    glance: [
      { label: "Usually priced on", value: "Size, weight, method and distance" },
      { label: "Typical equipment", value: "Step deck, lowboy, tow rig or driveaway" },
      { label: "Plan ahead", value: "Height, length and GVWR on hand" },
    ],
    needs: [
      { title: "The trucks", items: ["Quantity", "Year, make and model of each"] },
      {
        title: "Trailer preference",
        items: ["Flatbed, stretched flatbed, step deck, lowboy, removable gooseneck, flatbed double", "Auto carrier, dry van, air ride van, reefer, tanker or dump, if relevant", "Or no preference, so carriers propose a method"],
      },
    ],
    prep: [
      "Note each truck's height, length and GVWR from the door sticker in the details.",
      "Remove loose equipment from beds and bodies, or list what stays on.",
      "For driveaway, make sure the truck is registered, insured and road-legal for the trip.",
      "Photograph every truck and record the mileage.",
      "If a truck doesn't start, say whether the brakes release; trucks with air brakes need air pressure or caged brakes to roll.",
    ],
    faqs: [
      { question: "Can my truck be driven to its destination instead of hauled?", answer: "Some carriers offer driveaway with a professional driver. Mention it in the details; the truck must be road-legal, registered and insured for the trip." },
      { question: "Which trailer is right for my truck?", answer: "Taller trucks usually go on a step deck or lowboy to stay within height limits. If you're unsure, leave the trailer preference off and carriers will propose one in their bids." },
      { question: "Can I move several trucks at once?", answer: "Yes. Set the quantity and list year, make and model for each in the details." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["car_or_light_truck", "trailer", "heavy_equipment", "vehicle_parts"],
    tools: ["car-shipping", "pricing"],
  },

  rv: {
    h1: "RV transport for motorhomes and trailers",
    metaTitle: "RV Transport for Motorhomes, Fifth Wheels and Campers",
    metaDescription: "Ship a Class A, B or C motorhome, travel trailer or fifth wheel. Post RV type and dimensions, compare verified carrier bids and pay through escrow.",
    serviceType: "RV transport",
    intro:
      "Motorhomes can be driven by a professional driver or hauled on a trailer; travel trailers and fifth wheels are towed by a truck with the right hitch. Carriers need the RV type plus length, width, height and weight to choose the right truck and plan around bridge clearances.",
    glance: [
      { label: "Usually priced on", value: "RV type, length, height and distance" },
      { label: "Typical method", value: "Towed, hauled or driven" },
      { label: "Plan ahead", value: "Height to the top of the AC unit" },
    ],
    needs: [
      { title: "RV type", items: ["Class A, B or C motorhome", "Travel trailer, folding tent trailer, fifth wheel or truck camper"] },
      { title: "Dimensions", items: ["Length, width and height, to the top of roof units", "Weight in pounds"] },
    ],
    prep: [
      "Empty the black and gray tanks and drain fresh water lines; winterize if the route crosses freezing temperatures.",
      "Secure cabinets, drawers, the fridge door and anything loose inside.",
      "Retract slide-outs, awnings and steps.",
      "Turn off propane at the tank and disconnect house batteries.",
      "For towables, check tire age, bearings, brakes and the breakaway switch.",
    ],
    faqs: [
      { question: "Will my motorhome be driven or hauled?", answer: "Either, depending on the carrier. Say in the details if you don't want miles added; carriers who haul on a trailer will bid." },
      { question: "Does an RV need an oversize permit?", answer: "Most RVs are built within the standard 8.5-foot legal width, so permits are rare. Tall units still need an exact height for route planning." },
      { question: "Can I leave belongings inside?", answer: "Ask the carrier first. Secure everything you leave, and keep valuables with you; personal items are generally not covered by a carrier's cargo insurance." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["trailer", "car_or_light_truck", "commercial_truck", "powerboat"],
    tools: ["car-shipping", "pricing"],
  },

  trailer: {
    h1: "Trailer transport",
    metaTitle: "Trailer Transport for Utility, Cargo and Horse Trailers",
    metaDescription: "Ship a utility, cargo, horse or car trailer, towed or loaded onto a flatbed. Post length, width, height and weight and compare verified carrier bids.",
    serviceType: "Trailer transport",
    intro:
      "Utility, cargo, horse and car trailers are either towed by a carrier with the right hitch or loaded onto a flatbed when they're small or not roadworthy. The form asks for length, width, height and weight; add the hitch type in the details.",
    glance: [
      { label: "Usually priced on", value: "Length, weight, method and distance" },
      { label: "Typical method", value: "Towed, or hauled on a flatbed" },
      { label: "Plan ahead", value: "Hitch type and roadworthy tires and lights" },
    ],
    needs: [{ title: "Dimensions", items: ["Length, width and height", "Weight in pounds, empty or as loaded", "Hitch type in the details: ball size, gooseneck or fifth wheel"] }],
    prep: [
      "Note the hitch type and the trailer's GVWR from its VIN plate.",
      "Check tires, bearings, lights and brakes. A towed trailer rolls on its own wheels the whole way.",
      "Empty the trailer, or list what's inside and ask the carrier first.",
      "Have the title or registration ready for the driver.",
      "For horse trailers, secure the mats and take out tack and feed.",
    ],
    faqs: [
      { question: "Will my trailer be towed or hauled?", answer: "Roadworthy trailers are usually towed. Small or damaged trailers go on a flatbed. Say which you prefer in the details." },
      { question: "Can it ship with cargo inside?", answer: "Ask first. Cargo adds weight and is generally not covered by the carrier's insurance as part of a trailer move." },
      { question: "What if the trailer isn't roadworthy?", answer: "Say so, including tire and axle condition, so carriers bid with a flatbed or rollback." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["rv", "car_or_light_truck", "commercial_truck", "atv_powersports"],
    tools: ["pricing"],
  },

  vehicle_parts: {
    h1: "Ship engines, transmissions and auto parts",
    metaTitle: "Ship Engines, Transmissions and Auto Parts as Freight",
    metaDescription: "Ship engines, transmissions and palletized auto parts. Post dimensions, weight, quantity, packaging and hazmat status, then compare verified carrier bids.",
    serviceType: "Auto parts shipping",
    intro:
      "Engines, transmissions, body panels and palletized parts ship like freight: carriers price them on dimensions, weight, quantity and packaging. Tell them whether pieces stack and whether anything is hazardous, and they can quote shared space or a dedicated truck.",
    glance: [
      { label: "Usually priced on", value: "Dimensions, weight, count and class" },
      { label: "Typical equipment", value: "Pallets, crates, liftgate trucks" },
      { label: "Plan ahead", value: "Drain fluids before pickup" },
    ],
    needs: [
      { title: "Dimensions", items: ["Length, width and height of each unit in inches", "Weight in pounds, packaging included", "Quantity of items"] },
      { title: "Freight details", items: ["Stackable: can units go on top of each other", "Hazardous: chemicals, fuel or anything with a UN number", "Packaging: crate, pallet, box, or bundle, drum, roll and more"] },
    ],
    prep: [
      "Drain oil, coolant and fuel from engines and transmissions; leftover fluids can make a shipment hazardous or get it refused.",
      "Bolt engines to a pallet or engine shipping stand and stretch-wrap the unit.",
      "Protect painted panels with corner guards and foam, and mark them do-not-stack.",
      "Measure and weigh each unit after packing, pallet included.",
      "Have a forklift or dock at pickup, or ask for a liftgate truck.",
    ],
    faqs: [
      { question: "Is a used engine hazardous material?", answer: "A drained, clean engine usually ships as regular freight. Batteries, fuel and some fluids can be regulated as hazardous materials, so remove them or mark the shipment hazardous and describe it." },
      { question: "Do I need a pallet?", answer: "For engines and transmissions, yes; it lets the unit be lifted by forklift or pallet jack. Smaller parts can ship boxed." },
      { question: "What freight class will my parts be?", answer: "Class depends mostly on density: weight divided by cubic feet. Use the freight class calculator for an estimate; carriers confirm it in their bid." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["freight", "motorcycle", "car_or_light_truck", "commercial_truck"],
    tools: ["freight-class", "pricing"],
  },

  freight: {
    h1: "Post a freight load carriers can price",
    metaTitle: "Post a Freight Load: Dimensions, Packaging and Trailer",
    metaDescription: "List pallets or crates with dimensions, weight, packaging and trailer type so carriers can quote LTL or full truckload. Payment is held until delivery.",
    serviceType: "Freight shipping",
    intro:
      "Freight bids depend on four numbers per unit, length, width, height and weight, plus how it's packed and which trailer it needs. Post them accurately and carriers can quote shared LTL space or a full truckload without repricing at the dock.",
    glance: [
      { label: "Usually priced on", value: "Density, class, lane and trailer" },
      { label: "Typical equipment", value: "Dry van, reefer, flatbed, liftgate" },
      { label: "Plan ahead", value: "Weigh after packing" },
    ],
    needs: [
      { title: "Unit measurements", items: ["Length, width and height in inches", "Weight in pounds"] },
      { title: "Trailer preference", items: ["Dry van, air ride van, reefer, flatbed, step deck, lowboy and more", "Or no preference"] },
      { title: "Packaging", items: ["Crate, pallet, box", "Or bag, bale, bundle, can, carton, case, coil, cylinder, drum, loose, pail, reel, roll, pipe"] },
    ],
    prep: [
      "Measure each handling unit at its longest points, pallet included, in inches.",
      "Weigh every unit after packing. A reweigh at a terminal can change the price.",
      "Build pallets square: no overhang, heaviest items at the bottom, stretch-wrapped and banded.",
      "Label each unit with shipper, consignee and piece count, such as 1 of 4.",
      "Say whether both ends have a dock or forklift; without one, ask for a liftgate.",
      "Have bill of lading details ready: commodity, piece count, weight and special instructions.",
    ],
    faqs: [
      {
        question: "Should I ship LTL or full truckload?",
        answer: "LTL fits a few pallets that can share a trailer with other freight. Full truckload gives you the whole trailer and suits large shipments or freight that shouldn't be handled at terminals. Post your dimensions and carriers can bid on either.",
      },
      { question: "How is freight class determined?", answer: "Class runs from 50 for dense, durable freight to 500 for light, bulky freight. Density, weight per cubic foot, is the biggest factor, with handling, stowability and liability also considered." },
      { question: "Can I ship hazardous materials?", answer: "Only with carriers qualified to haul them. Describe the material and its UN number in the details so the right carriers bid." },
      { question: "Do I need a liftgate?", answer: "If either end has no loading dock or forklift, yes. Mention it so the carrier sends a truck with one." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["vehicle_parts", "heavy_equipment", "business_moving", "truck_rental"],
    tools: ["freight-class", "pricing"],
  },

  heavy_equipment: {
    h1: "Heavy equipment hauling: what to post",
    metaTitle: "Heavy Equipment Hauling: Specs Carriers Need to Bid",
    metaDescription: "Post an excavator, dozer, loader or tractor with model, transport dimensions and weight. Verified heavy haulers bid with the right trailer and permits.",
    serviceType: "Heavy equipment transport",
    intro:
      "Bulldozers, excavators, loaders, tractors and generators are priced on their transport dimensions and weight, which decide the trailer and whether the load needs permits. Give carriers the make, model and year, and they can check the spec sheet themselves.",
    glance: [
      { label: "Usually priced on", value: "Weight, dimensions, permits and distance" },
      { label: "Typical equipment", value: "Step deck, lowboy or removable gooseneck" },
      { label: "Plan ahead", value: "Firm, level loading area at both ends" },
    ],
    needs: [
      { title: "The machine", items: ["Year, make and model", "Quantity", "Type: bulldozer, excavator, forklift, crane, tractor, backhoe, loader, generator or other", "Category: construction, agricultural, industrial, mining or other"] },
      { title: "Size", items: ["Transport length, width and height, in the position it will ship", "Operating weight with attachments"] },
      { title: "Trailer", items: ["Open trailer, enclosed trailer, or either"] },
    ],
    prep: [
      "Find the operating weight and transport dimensions in the spec sheet and add them to your post.",
      "Remove buckets and attachments, or list them with their weights.",
      "Say whether the machine runs and can be driven onto the trailer; if not, the carrier needs a winch or crane.",
      "Clean off mud and loose debris that could fall on the highway.",
      "Make sure both sites have a firm, level area where the trailer can turn and load.",
    ],
    faqs: [
      { question: "Will my equipment need permits?", answer: "Loads wider than 8.5 feet, too tall for the route or above legal weight need oversize or overweight permits, which vary by state. Carriers arrange them for their route; check that the cost is in the bid." },
      { question: "Which trailer will carriers use?", answer: "Lighter machines often fit a flatbed or step deck. Tall or heavy machines usually go on a lowboy or removable gooseneck, which sits lower to the ground." },
      { question: "Who loads the machine?", answer: "If it runs, the driver or your operator usually drives it on. Agree in chat who operates it at each end." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["freight", "commercial_truck", "vehicle_parts", "trailer"],
    tools: ["pricing"],
  },

  truck_rental: {
    h1: "Book a truck by size and equipment",
    metaTitle: "Reserve a Box Truck, Cargo Van or Flatbed with a Driver",
    metaDescription: "Choose the truck type, from cargo vans to 26 ft box trucks and flatbeds, plus liftgate, pallet jack or ramp. Verified carriers bid; payment is held in escrow.",
    serviceType: "Truck rental with driver",
    intro:
      "When you know the truck you need, reserve it by type: a cargo van, a 16 ft box truck, a flatbed or a reefer. Every truck comes from a verified carrier with its own driver, and you choose the equipment on board.",
    glance: [
      { label: "Usually priced on", value: "Truck type, time and distance" },
      { label: "Options", value: "Liftgate, pallet jack, moving ramp" },
      { label: "Plan ahead", value: "Clearance and parking at each stop" },
    ],
    needs: [
      { title: "The load", items: ["What you're moving, from household goods to LTL freight or equipment"] },
      { title: "The truck", items: ["Truck type: sprinter or cargo van, pickup, flatbed, box truck from 6 to 26 ft, reefer, stake bed, dump truck, car hauler, tractor and more"] },
      { title: "Equipment and service", items: ["Liftgate", "Pallet jack", "Moving ramp", "Call before delivery", "Driver assistance with loading, with a short description"] },
    ],
    prep: [
      "Estimate your volume with the cubic feet calculator so you don't book a truck that's too small.",
      "Check height clearance, parking and truck access at every stop.",
      "Ask for a liftgate for pallets or heavy items if there is no loading dock.",
      "Have the load ready and staged near the door when the truck arrives.",
    ],
    faqs: [
      { question: "Do I drive the truck?", answer: "No. Every truck on AllShip is operated by the carrier's own driver. You choose the truck type and equipment; the carrier provides the truck and the driver." },
      { question: "Will the driver help load?", answer: "Turn on driver assistance and describe what you need. If the job needs a full crew, add a heavy lifting post or choose truck with driver." },
      { question: "Which truck size do I need?", answer: "As a rough guide, a 10 ft truck fits a studio or small one-bedroom, a 16 ft truck a one- or two-bedroom home and a 26 ft truck a larger home. The truck rental page has a size comparison." },
      { question: "When is the carrier paid?", answer: escrowAnswer },
    ],
    related: ["truck_with_driver", "freight", "local_moving", "household_items"],
    tools: ["cubic-feet", "pricing"],
  },

  truck_with_driver: {
    h1: "A truck and driver for a few hours",
    metaTitle: "Truck with Driver by the Hour for Pickups and Small Moves",
    metaDescription: "Book a truck and driver by the hour or a flat price for pickups, store deliveries and small moves. Post hours, truck size and helpers, then compare bids.",
    serviceType: "Truck with driver",
    intro:
      "A truck and driver for a few hours covers the jobs between a delivery and a full move: a couch from a marketplace seller, a store pickup, a studio apartment, a load to the donation center. Say how long you think it will take, what size truck and whether you need a helper.",
    glance: [
      { label: "Usually priced on", value: "Hours or a flat job price" },
      { label: "Typical truck", value: "Cargo van to 16 ft box truck" },
      { label: "Plan ahead", value: "Every stop listed in order" },
    ],
    needs: [
      { title: "Time and truck", items: ["Hours you expect the job to take", "Truck size: cargo van, pickup or box truck", "Hourly or flat price preference"] },
      { title: "Help", items: ["Driver only, or driver plus one or more helpers", "Stairs or elevators at each stop"] },
      { title: "Route and items", items: ["Every pickup and drop-off in order", "A short list of large items, with photos if you have them"] },
    ],
    prep: [
      "List every stop in order so the driver can plan the route and time.",
      "Have items ready to load near the door and paid for at any store or seller.",
      "Measure large items and the doors they need to go through.",
      "Add a helper if anything takes two people to carry.",
    ],
    faqs: [
      { question: "Hourly or flat price: which is better?", answer: "Hourly suits jobs where the time is hard to predict. A flat price suits clearly defined jobs. Either way, the amount you pay into escrow is the accepted bid plus the 10% AllShip service fee." },
      { question: "Does the driver help load?", answer: "Say whether you need help. Many drivers will help with loading; for heavy or many items, add a helper so the bid includes a second person." },
      { question: "What if the job runs over the hours I posted?", answer: "Agree in the AllShip chat before the extra time starts, so there are no surprises when you confirm delivery." },
      { question: "When is the driver paid?", answer: escrowAnswer },
    ],
    related: ["truck_rental", "household_items", "heavy_lifting", "local_moving"],
    tools: ["cubic-feet", "pricing"],
  },
};

export const categoryDetail = (key: LoadCategory) => categoryDetails[key];
