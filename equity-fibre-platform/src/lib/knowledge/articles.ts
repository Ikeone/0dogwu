/**
 * Seed knowledge-base content. Realistic, approved support answers. Because the
 * exact modem model is unknown (Q33), model-specific articles are generic and
 * flagged needsReview. We never fabricate specific light colours/button
 * positions/port names.
 */
export interface SeedArticle {
  slug: string;
  title: string;
  body: string;
  tags: string[];
  needsReview?: boolean;
}

export const KNOWLEDGE_ARTICLES: SeedArticle[] = [
  {
    slug: "what-is-equity-fibre",
    title: "What is Stride Broadband?",
    body: "Stride Broadband is a low-cost home fibre broadband plan for eligible households. It offers 100 Mbps download and 20 Mbps upload for up to $30 per month. Eligibility conditions apply, and an upfront modem contribution may be required.",
    tags: ["overview", "plan", "about", "equity", "fibre"],
  },
  {
    slug: "who-can-qualify",
    title: "Who may qualify for Stride Broadband?",
    body: "To qualify, your address must already have a Chorus fibre box (ONT) installed, and the fibre must have been inactive for at least three months. Your household also needs to meet an approved category (such as public or community housing) and provide approved low-income evidence such as a Community Services Card. The exact launch criteria are being confirmed.",
    tags: ["eligibility", "qualify", "criteria", "housing", "evidence"],
  },
  {
    slug: "inactivity-requirement",
    title: "Why can an address fail the three-month inactivity check?",
    body: "Stride Broadband is intended for homes that have not had an active fibre connection recently. If your address has had fibre broadband switched on within the last three months, it will not currently qualify. This is checked against network records.",
    tags: ["eligibility", "inactivity", "three months", "active", "address"],
  },
  {
    slug: "what-is-an-ont",
    title: "What is an ONT (fibre box)?",
    body: "An ONT (Optical Network Terminal) is the small box on your wall that the fibre cable connects to. Your modem plugs into the ONT to give you internet. If there is no ONT at your address, fibre has not been installed there yet.",
    tags: ["ont", "fibre box", "modem", "setup", "hardware"],
  },
  {
    slug: "evidence-required",
    title: "What evidence may be required?",
    body: "You may be asked to provide approved low-income evidence, for example a Community Services Card or a MyMSD Benefit Breakdown Letter. Upload a clear photo or PDF. We store evidence securely and only use it to assess your application. We cannot confirm document authenticity automatically — an authorised process handles verification.",
    tags: ["evidence", "community services card", "msd", "documents", "upload"],
  },
  {
    slug: "how-much-it-costs",
    title: "How much does Stride Broadband cost?",
    body: "The monthly price is up to $30 (this working figure includes GST). There is also a one-off upfront modem contribution. The upfront amount is shown clearly before you pay. Monthly billing only starts once your fibre service is activated — not when your modem is delivered.",
    tags: ["cost", "price", "monthly", "modem", "payment", "gst"],
  },
  {
    slug: "modem-payment-explained",
    title: "Understanding the upfront modem contribution",
    body: "Your plan includes a managed modem. Because the modem and shipping have a cost, a one-off upfront contribution applies. The exact amount is shown before you confirm payment. You pay this once, before the modem is shipped.",
    tags: ["modem", "payment", "upfront", "contribution", "cost"],
  },
  {
    slug: "order-and-delivery-stages",
    title: "Order and delivery stages",
    body: "After you're approved and your upfront payment succeeds: (1) a modem is assigned to you, (2) it is packed and shipped, (3) you can track delivery, and (4) your fibre service is provisioned and activated. You can see each stage in your customer portal.",
    tags: ["order", "delivery", "shipping", "tracking", "stages", "status"],
  },
  {
    slug: "generic-modem-setup",
    title: "Setting up your modem (general guide)",
    body: "Place the modem near your ONT (fibre box). Connect the modem's WAN port to the ONT using the supplied cable, then plug in the power. Wait a few minutes for the modem to start up. Connect your phone or computer to the Wi-Fi name shown on the modem's label. Exact port names and light meanings depend on the specific modem model, which will be confirmed.",
    tags: ["setup", "modem", "install", "wifi", "cable", "power"],
    needsReview: true,
  },
  {
    slug: "connect-modem-to-ont",
    title: "Connecting the modem to the ONT",
    body: "Use the network cable supplied in the box. Plug one end into the ONT's data port and the other into the modem's WAN/Internet port. If you're unsure which port is which, check the label on the modem. Do not force connectors.",
    tags: ["ont", "cable", "wan", "connect", "modem", "port"],
    needsReview: true,
  },
  {
    slug: "identify-correct-cable",
    title: "Identifying the correct cable",
    body: "Your box contains a power adapter and at least one network cable. The network cable has a wider clip connector (RJ45). Use it to connect the modem to the ONT. If a cable looks damaged, don't use it — contact support for a replacement.",
    tags: ["cable", "rj45", "network", "setup"],
  },
  {
    slug: "power-cycle-safely",
    title: "How to power cycle safely",
    body: "To restart your modem: turn it off at the wall or unplug the power, wait about 30 seconds, then plug it back in. Allow a few minutes for it to fully restart before testing your connection. Do not open the modem casing.",
    tags: ["restart", "power cycle", "reboot", "troubleshoot", "modem"],
  },
  {
    slug: "connect-device-to-wifi",
    title: "Connecting a phone or computer to Wi-Fi",
    body: "On your device, open Wi-Fi settings and choose the network name printed on your modem's label. Enter the Wi-Fi password from the same label. Keep this password private. You can usually change the network name and password later in the modem's settings.",
    tags: ["wifi", "connect", "password", "phone", "computer", "network"],
  },
  {
    slug: "wifi-network-not-appearing",
    title: "What to do if the Wi-Fi network does not appear",
    body: "If you can't see your Wi-Fi network: check the modem has power and has finished starting up, move closer to the modem, and restart your device's Wi-Fi. If it still doesn't appear after a full restart of the modem, contact support.",
    tags: ["wifi", "not appearing", "troubleshoot", "network", "missing"],
  },
  {
    slug: "internet-light-off",
    title: "What to do if the internet light is off",
    body: "If your modem shows no internet indicator after starting up, check that the cable between the modem and the ONT is firmly connected at both ends, and that the ONT has power. Then power cycle the modem. Light names and colours vary by model and will be confirmed for your specific modem.",
    tags: ["internet light", "no internet", "troubleshoot", "ont", "modem"],
    needsReview: true,
  },
  {
    slug: "ont-alarm-or-los",
    title: "What to do if the ONT alarm or LOS light is active",
    body: "An alarm or LOS (Loss of Signal) indicator on the ONT usually means the fibre signal isn't reaching your home. This is a network issue rather than something you can fix by changing settings. Please contact support so we can raise it with the network provider.",
    tags: ["los", "alarm", "ont", "signal", "fault", "escalate"],
    needsReview: true,
  },
  {
    slug: "password-and-wifi-safety",
    title: "Password and Wi-Fi safety",
    body: "Keep your Wi-Fi password private and change it if you think others know it. We will never ask you for your Wi-Fi password, card numbers, or benefit details in a chat. If someone asks you for these, do not share them.",
    tags: ["password", "safety", "security", "wifi", "privacy"],
  },
  {
    slug: "payment-failure-process",
    title: "What happens if a payment fails?",
    body: "If a monthly payment fails, we'll let you know and give you a grace period to update your payment method. A single failed payment does not immediately disconnect your service. You can update your payment details in the customer portal.",
    tags: ["payment", "failed", "grace period", "billing", "recover"],
  },
  {
    slug: "update-contact-details",
    title: "How to update your contact details",
    body: "You can update your email, phone number, and contact preferences in the 'Contact preferences' section of your customer portal. Marketing messages are optional and separate from important service messages.",
    tags: ["contact", "update", "details", "preferences", "email", "phone"],
  },
  {
    slug: "how-to-cancel",
    title: "How to cancel",
    body: "You can ask to cancel your service from the customer portal or by contacting support. Any return of equipment and applicable terms will be explained at that time. Cancellation and refund terms are being finalised.",
    tags: ["cancel", "close account", "stop", "return"],
  },
  {
    slug: "make-a-privacy-request",
    title: "How to make a privacy request",
    body: "You can ask to access or correct your personal information, or request deletion (subject to legal obligations), from the 'Privacy & data' section of your portal. Our privacy contact will handle your request.",
    tags: ["privacy", "access", "correction", "deletion", "data request"],
  },
  {
    slug: "reach-human-support",
    title: "How to reach a human",
    body: "If the assistant can't help, it will offer to create a support ticket so a person can follow up. You can also ask to speak to a human at any time and we'll escalate your conversation.",
    tags: ["human", "support", "escalate", "ticket", "help", "contact"],
  },
];
