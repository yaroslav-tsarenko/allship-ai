import type { DescriptionBlock } from "@/components/sections";

export const timeSchedule = {
  title: "Time Schedule",
  description:
    "AI is changing how transportation is scheduled by bringing real-time updates, predictive analytics and automated processes into planning. Used well, these tools make operations smoother, cut costs and leave customers more satisfied.",
  sections: [
    {
      title: "1. Real-time updates",
      content: "AI-driven systems give instant updates on shipment status and transit conditions. Real-time updates help businesses:",
      list: {
        items: [
          "Adapt to unexpected delays by adjusting schedules as they happen.",
          "Communicate better with customers through accurate delivery estimates.",
          "Coordinate logistics teams more efficiently.",
        ],
      },
    },
    {
      title: "2. Predictive analytics",
      content: "Predictive analytics uses historical data and machine learning to forecast likely disruptions. Key benefits include:",
      list: {
        items: ["Identifying high-risk routes or times for shipments.", "Preparing alternative plans to minimize downtime.", "Allocating resources to meet delivery demand."],
      },
    },
    {
      title: "3. Automated scheduling",
      content: "Automation streamlines scheduling, reduces manual work and increases precision. Key advantages:",
      list: {
        items: ["Fewer manual errors that lead to costly delays.", "Staff freed up for higher-value tasks.", "Schedules that stay aligned with real-world conditions."],
      },
    },
    {
      title: "4. Better customer experience",
      content: "AI-assisted scheduling creates a better customer experience by:",
      list: {
        items: ["Delivering goods on time more consistently.", "Providing transparency through tracking and notifications.", "Making service more reliable and reducing complaints."],
      },
    },
    {
      title: "5. Cost optimization",
      content: "AI helps reduce operating costs by:",
      list: {
        items: ["Lowering fuel consumption through route optimization.", "Reducing unnecessary stops and idle time.", "Avoiding penalties for missed deadlines or delays."],
      },
    },
    {
      title: "6. Fleet management integration",
      content: "Integration with fleet management systems allows for:",
      list: {
        items: ["Tracking vehicle performance and maintenance needs.", "Assigning jobs to the most suitable vehicles.", "Balancing workloads to prevent overuse of equipment."],
      },
    },
    {
      title: "7. Adaptive scheduling",
      content: "AI adapts to changing conditions in real time by:",
      list: {
        items: ["Taking weather forecasts into account to avoid delays.", "Adjusting for traffic congestion and road closures.", "Reprioritizing tasks so critical deliveries arrive on time."],
      },
    },
    {
      title: "8. Data-driven decisions",
      content: "AI scheduling uses data to support strategic decisions, such as:",
      list: {
        items: ["Finding peak operating times.", "Forecasting demand to prepare resources in advance.", "Analyzing historical trends for continual improvement."],
      },
    },
    {
      title: "9. Sustainability",
      content: "AI-assisted scheduling supports greener logistics by:",
      list: {
        items: ["Reducing emissions through better routing.", "Cutting fuel use and wasteful practices.", "Encouraging lower-emission transportation choices."],
      },
    },
    {
      title: "10. Scalability for growing businesses",
      content: "As a business grows, AI scheduling helps it scale by:",
      list: {
        items: ["Handling more shipments without adding complexity.", "Supporting a wider range of lanes and load types.", "Keeping up with a growing customer base."],
      },
    },
  ] satisfies DescriptionBlock[],
};

export const timeScheduleNote = {
  title: "How timing works on AllShip AI",
  items: [
    "When you post a load, you pick the pickup and delivery dates or date windows.",
    "Verified carriers bid with the dates they can meet. You choose the bid that fits your schedule.",
    "After booking, you message the carrier in the app and follow the trip until delivery.",
    "Payment is held until you confirm delivery, so the carrier is paid when the job is done.",
  ],
  cta: { label: "Post a load", href: "/quote" },
};
