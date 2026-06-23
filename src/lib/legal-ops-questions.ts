import type { BusinessQuestion } from "./ai-specs-questions";

export const LEGAL_OPS_QUESTIONS: BusinessQuestion[] = [
  // ── Employment Act 1955 ──────────────────────────────────────────
  {
    id: "law-ea-001",
    topic: "Employment Act 1955",
    question:
      "After the 2022 amendments, the Employment Act 1955 now covers:",
    options: [
      "Only employees earning RM2,000 or less per month",
      "Only employees earning RM4,000 or less per month",
      "All employees regardless of wages (with certain provisions limited to those earning RM4,000 or less)",
      "Only Malaysian citizens",
    ],
    answer: "All employees regardless of wages (with certain provisions limited to those earning RM4,000 or less)",
    explanation:
      "The Employment (Amendment) Act 2022 extended coverage to ALL employees regardless of salary. However, certain provisions like overtime pay, termination benefits, and rest day pay still only apply to employees earning RM4,000/month or less, or manual labourers.",
  },
  {
    id: "law-ea-002",
    topic: "Employment Act 1955",
    question:
      "What is the maximum number of working hours per week under the Employment Act 1955 (post-2022 amendment)?",
    options: [
      "40 hours",
      "42 hours",
      "45 hours",
      "48 hours",
    ],
    answer: "45 hours",
    explanation:
      "The 2022 amendment reduced the maximum working hours from 48 to 45 hours per week. This can be spread across 5 or 6 working days, typically not exceeding 8 hours per day (9 hours if fewer than 6 working days per week).",
  },
  {
    id: "law-ea-003",
    topic: "Employment Act 1955",
    question:
      "What is the overtime rate for work on a NORMAL working day?",
    options: [
      "1.0x the hourly rate",
      "1.5x the hourly rate",
      "2.0x the hourly rate",
      "3.0x the hourly rate",
    ],
    answer: "1.5x the hourly rate",
    explanation:
      "Under Section 60A(3) of the Employment Act 1955, overtime on a normal working day is paid at not less than 1.5 times the hourly rate. On rest days it is 2.0x, and on public holidays it is 3.0x.",
  },
  {
    id: "law-ea-004",
    topic: "Employment Act 1955",
    question:
      "What is the overtime rate for work performed on a PUBLIC HOLIDAY?",
    options: [
      "1.5x the hourly rate",
      "2.0x the hourly rate",
      "2.5x the hourly rate",
      "3.0x the hourly rate",
    ],
    answer: "3.0x the hourly rate",
    explanation:
      "Under the Employment Act 1955, overtime work on a public holiday is paid at 3.0x the hourly rate. The hierarchy is: normal day = 1.5x, rest day = 2.0x, public holiday = 3.0x.",
  },
  {
    id: "law-ea-005",
    topic: "Employment Act 1955",
    question:
      "How many gazetted public holidays must an employer provide per year?",
    options: [
      "8 days",
      "10 days",
      "11 days",
      "14 days",
    ],
    answer: "11 days",
    explanation:
      "Under Section 60D, employees are entitled to a minimum of 11 gazetted public holidays per year. Five are mandatory (National Day, Agong's Birthday, Workers' Day, Malaysia Day, and the state's ruler/governor birthday), and the employer chooses the remaining six from the gazetted list.",
  },
  {
    id: "law-ea-006",
    topic: "Employment Act 1955",
    question:
      "The Employment Act 1955 applies to which geographical area of Malaysia?",
    options: [
      "All of Malaysia including Sabah and Sarawak",
      "Peninsular Malaysia and the Federal Territory of Labuan only",
      "Peninsular Malaysia only (excluding Labuan)",
      "West Malaysia and East Malaysia equally",
    ],
    answer: "Peninsular Malaysia and the Federal Territory of Labuan only",
    explanation:
      "The Employment Act 1955 applies to Peninsular Malaysia and Labuan. Sabah and Sarawak have their own separate labour ordinances: the Sabah Labour Ordinance (Cap. 67) and the Sarawak Labour Ordinance (Cap. 76).",
  },

  // ── Leave Entitlements ───────────────────────────────────────────
  {
    id: "law-lv-001",
    topic: "Leave Entitlements",
    question:
      "An employee with 3 years of service is entitled to how many days of annual leave?",
    options: ["8 days", "10 days", "12 days", "16 days"],
    answer: "12 days",
    explanation:
      "Under Section 60E: less than 2 years of service = 8 days, 2 to 5 years = 12 days, more than 5 years = 16 days per year.",
  },
  {
    id: "law-lv-002",
    topic: "Leave Entitlements",
    question:
      "How many days of paid sick leave is an employee with less than 2 years of service entitled to?",
    options: ["10 days", "14 days", "18 days", "22 days"],
    answer: "14 days",
    explanation:
      "Under Section 60F: less than 2 years = 14 days, 2 to 5 years = 18 days, more than 5 years = 22 days. If hospitalization is required, an additional 60 days is provided (total inclusive of the non-hospitalization entitlement).",
  },
  {
    id: "law-lv-003",
    topic: "Leave Entitlements",
    question:
      "What is the maternity leave entitlement under the Employment Act 1955 (post-2022 amendment)?",
    options: ["60 days", "90 days", "98 days", "120 days"],
    answer: "98 days",
    explanation:
      "The 2022 amendment increased maternity leave from 60 to 98 consecutive days. A female employee is eligible if she has been employed for at least 4 months before her expected delivery date and has fewer than 5 surviving children.",
  },
  {
    id: "law-lv-004",
    topic: "Leave Entitlements",
    question:
      "How many days of paid paternity leave was introduced by the 2022 amendment?",
    options: ["3 days", "5 days", "7 days", "14 days"],
    answer: "7 days",
    explanation:
      "The Employment (Amendment) Act 2022 introduced 7 consecutive days of paid paternity leave for married male employees who have been employed for at least 12 months and have fewer than 5 surviving children.",
  },
  {
    id: "law-lv-005",
    topic: "Leave Entitlements",
    question:
      "An employee with 6 years of service is entitled to how many days of annual leave?",
    options: ["8 days", "12 days", "16 days", "21 days"],
    answer: "16 days",
    explanation:
      "Under Section 60E, employees with more than 5 years of service are entitled to 16 days of annual leave per year. This is the highest statutory tier (less than 2 years = 8, 2-5 years = 12, more than 5 years = 16).",
  },
  {
    id: "law-lv-006",
    topic: "Leave Entitlements",
    question:
      "An employee with 4 years of service who requires hospitalization is entitled to a total of how many days of sick leave?",
    options: ["18 days", "22 days", "60 days", "78 days"],
    answer: "60 days",
    explanation:
      "For employees with 2-5 years of service, the base sick leave is 18 days. If hospitalization is required, the total entitlement (including the base) extends to 60 days. The hospitalization entitlement is not additional - it is inclusive.",
  },

  // ── Minimum Wages Order ──────────────────────────────────────────
  {
    id: "law-mw-001",
    topic: "Minimum Wages Order",
    question: "What is the minimum wage in Malaysia as of 2024?",
    options: [
      "RM1,200 per month",
      "RM1,500 per month",
      "RM1,800 per month",
      "RM2,000 per month",
    ],
    answer: "RM1,500 per month",
    explanation:
      "The Minimum Wages Order 2024 set the national minimum wage at RM1,500 per month (or RM7.21 per hour). This applies uniformly across Peninsular Malaysia, Sabah, Sarawak, and Labuan.",
  },
  {
    id: "law-mw-002",
    topic: "Minimum Wages Order",
    question:
      "Which employers are exempt from the Minimum Wages Order?",
    options: [
      "All small businesses with fewer than 10 employees",
      "Domestic servants (household workers) are excluded from the minimum wage",
      "All employers in East Malaysia",
      "No employers are exempt - it applies to all without exception",
    ],
    answer: "Domestic servants (household workers) are excluded from the minimum wage",
    explanation:
      "Domestic servants (as defined under the Employment Act 1955) are excluded from the Minimum Wages Order. The minimum wage otherwise applies to all private sector employees regardless of employer size.",
  },
  {
    id: "law-mw-003",
    topic: "Minimum Wages Order",
    question:
      "What is the approximate hourly minimum wage rate in Malaysia (2024)?",
    options: ["RM5.77", "RM6.25", "RM7.21", "RM8.50"],
    answer: "RM7.21",
    explanation:
      "The hourly minimum wage is RM7.21, calculated from the monthly rate of RM1,500 divided by the standard working hours. This is used for part-time and hourly-paid workers.",
  },
  {
    id: "law-mw-004",
    topic: "Minimum Wages Order",
    question:
      "Can an employer pay less than the minimum wage if the employee agrees to it?",
    options: [
      "Yes, if both parties agree in writing",
      "Yes, during a probation period of up to 6 months",
      "No, the minimum wage is a statutory floor that cannot be contracted out of",
      "Yes, if the employee is a part-time worker",
    ],
    answer: "No, the minimum wage is a statutory floor that cannot be contracted out of",
    explanation:
      "The minimum wage is a mandatory legal requirement. Any contract term that pays below the minimum wage is void. Employers who pay below the minimum wage face fines of up to RM10,000 per employee.",
  },

  // ── Termination & Retrenchment ───────────────────────────────────
  {
    id: "law-tr-001",
    topic: "Termination & Retrenchment",
    question:
      "What is the minimum notice period for an employee with less than 2 years of service?",
    options: ["1 week", "2 weeks", "4 weeks", "6 weeks"],
    answer: "4 weeks",
    explanation:
      "Under Section 12 of the Employment Act 1955: less than 2 years = 4 weeks notice, 2 to 5 years = 6 weeks, more than 5 years = 8 weeks. These are minimum periods - contracts may provide longer notice.",
  },
  {
    id: "law-tr-002",
    topic: "Termination & Retrenchment",
    question:
      "What is the termination benefit rate for each year of service (for employees earning RM4,000 or less)?",
    options: [
      "5 days wages per year of service",
      "10 days wages per year of service",
      "15 days wages per year of service",
      "20 days wages per year of service",
    ],
    answer: "10 days wages per year of service",
    explanation:
      "Under the Employment (Termination and Lay-Off Benefits) Regulations 1980, employees who have worked for at least 12 months are entitled to 10 days wages for each year of service (for the first 2 years), 15 days for each subsequent year up to 5 years, and 20 days for each year beyond 5 years.",
  },
  {
    id: "law-tr-003",
    topic: "Termination & Retrenchment",
    question: "What is 'constructive dismissal'?",
    options: [
      "A dismissal that follows proper procedure",
      "When an employer's conduct makes working conditions so intolerable that the employee is forced to resign",
      "When an employee is dismissed during construction work",
      "When an employee is terminated for poor performance",
    ],
    answer: "When an employer's conduct makes working conditions so intolerable that the employee is forced to resign",
    explanation:
      "Constructive dismissal occurs when the employer fundamentally breaches the employment contract (e.g., drastic pay cut, demotion without cause, harassment), leaving the employee no reasonable choice but to resign. The employee can claim unfair dismissal at the Industrial Court.",
  },
  {
    id: "law-tr-004",
    topic: "Termination & Retrenchment",
    question:
      "Under the LIFO principle in retrenchment, who should be retrenched first?",
    options: [
      "The most senior employees",
      "The most recently hired employees (last in, first out)",
      "The highest-paid employees",
      "Employees chosen randomly",
    ],
    answer: "The most recently hired employees (last in, first out)",
    explanation:
      "LIFO (Last In, First Out) is the generally accepted principle in Malaysian industrial law for retrenchment. The most recently hired employees in the affected category should be retrenched first, unless there is a justifiable reason to deviate.",
  },
  {
    id: "law-tr-005",
    topic: "Termination & Retrenchment",
    question:
      "An employee who feels they were unfairly dismissed can make a representation to the Director General within how many days?",
    options: ["30 days", "60 days", "90 days", "180 days"],
    answer: "60 days",
    explanation:
      "Under Section 20 of the Industrial Relations Act 1967, an employee who considers their dismissal to be without just cause or excuse must submit a written representation to the Director General of Industrial Relations within 60 days of the dismissal.",
  },

  // ── East Malaysia Differences ────────────────────────────────────
  {
    id: "law-em-001",
    topic: "East Malaysia Differences",
    question:
      "Which labour law governs employment in Sabah?",
    options: [
      "Employment Act 1955",
      "Sabah Labour Ordinance (Cap. 67)",
      "Industrial Relations Act 1967",
      "Sabah Employment Act 2000",
    ],
    answer: "Sabah Labour Ordinance (Cap. 67)",
    explanation:
      "Sabah has its own Sabah Labour Ordinance (Cap. 67) which governs employment matters. While similar in many respects to the Employment Act 1955, it has different thresholds and provisions specific to Sabah.",
  },
  {
    id: "law-em-002",
    topic: "East Malaysia Differences",
    question:
      "Which labour law governs employment in Sarawak?",
    options: [
      "Employment Act 1955",
      "Sabah Labour Ordinance",
      "Sarawak Labour Ordinance (Cap. 76)",
      "Sarawak Workers Act",
    ],
    answer: "Sarawak Labour Ordinance (Cap. 76)",
    explanation:
      "Sarawak is governed by its own Sarawak Labour Ordinance (Cap. 76). The Employment Act 1955 does not apply in Sarawak. However, federal laws like the Industrial Relations Act 1967 and the Minimum Wages Order apply across all of Malaysia.",
  },
  {
    id: "law-em-003",
    topic: "East Malaysia Differences",
    question:
      "Does the Minimum Wages Order 2024 apply to Sabah and Sarawak?",
    options: [
      "No, Sabah and Sarawak have their own minimum wage rates",
      "Yes, the RM1,500/month rate applies nationwide including Sabah and Sarawak",
      "Only in Sabah, not Sarawak",
      "Yes, but at a lower rate of RM1,200/month",
    ],
    answer: "Yes, the RM1,500/month rate applies nationwide including Sabah and Sarawak",
    explanation:
      "The Minimum Wages Order 2024 applies uniformly across all of Malaysia at RM1,500/month. Previously there was a differential rate for Sabah, Sarawak, and Labuan, but this was equalized from 2023 onwards.",
  },

  // ── Industrial Relations Act 1967 ────────────────────────────────
  {
    id: "law-ir-001",
    topic: "Industrial Relations Act 1967",
    question:
      "Which body adjudicates trade disputes referred by the Minister of Human Resources?",
    options: [
      "The High Court",
      "The Industrial Court",
      "The Labour Court",
      "The Trade Union Tribunal",
    ],
    answer: "The Industrial Court",
    explanation:
      "The Industrial Court, established under Part VII of the Industrial Relations Act 1967, adjudicates trade disputes including unfair dismissal cases referred by the Minister of Human Resources. Its awards are final and binding.",
  },
  {
    id: "law-ir-002",
    topic: "Industrial Relations Act 1967",
    question:
      "Under the Industrial Relations Act 1967, can a worker be dismissed for joining a trade union?",
    options: [
      "Yes, if the employer has fewer than 50 employees",
      "Yes, during the first year of employment",
      "No, dismissal for trade union membership or activity is prohibited",
      "Yes, if the trade union is not registered",
    ],
    answer: "No, dismissal for trade union membership or activity is prohibited",
    explanation:
      "Section 5 of the Industrial Relations Act 1967 protects workers from discrimination or dismissal for trade union membership or participation in lawful trade union activities. Employers who violate this face penalties.",
  },
  {
    id: "law-ir-003",
    topic: "Industrial Relations Act 1967",
    question:
      "What is 'collective bargaining' in the context of Malaysian labour law?",
    options: [
      "Individual salary negotiation between an employee and employer",
      "Negotiations between a trade union and employer to determine terms and conditions of employment",
      "A court-ordered dispute resolution process",
      "Government setting of wages for all industries",
    ],
    answer: "Negotiations between a trade union and employer to determine terms and conditions of employment",
    explanation:
      "Collective bargaining is the process where a recognized trade union negotiates with the employer on behalf of its members regarding wages, working conditions, benefits, and other employment terms. The result is a Collective Agreement binding on both parties.",
  },

  // ── PDPA 2010 ────────────────────────────────────────────────────
  {
    id: "law-pdpa-001",
    topic: "PDPA 2010",
    question:
      "The Personal Data Protection Act 2010 (PDPA) applies to:",
    options: [
      "Only government agencies",
      "Commercial transactions involving personal data processed in Malaysia",
      "All data processing worldwide",
      "Only financial institutions",
    ],
    answer: "Commercial transactions involving personal data processed in Malaysia",
    explanation:
      "The PDPA 2010 applies to any person who processes personal data in the context of commercial transactions in Malaysia. It does not apply to the federal and state governments, or to personal data processed outside Malaysia.",
  },
  {
    id: "law-pdpa-002",
    topic: "PDPA 2010",
    question:
      "How many data protection principles are established under the PDPA 2010?",
    options: ["5 principles", "7 principles", "10 principles", "12 principles"],
    answer: "7 principles",
    explanation:
      "The PDPA 2010 establishes 7 principles: General (lawful processing), Notice and Choice, Disclosure, Security, Retention, Data Integrity, and Access. All data users must comply with these principles.",
  },
  {
    id: "law-pdpa-003",
    topic: "PDPA 2010",
    question:
      "Under the PDPA 2010, an employer collecting employee personal data must:",
    options: [
      "Only inform employees verbally",
      "Provide written notice of the purpose and obtain consent before or at the time of collection",
      "No notice is required for employee data",
      "Only inform employees after the data has been processed",
    ],
    answer: "Provide written notice of the purpose and obtain consent before or at the time of collection",
    explanation:
      "Under the Notice and Choice Principle, the data user must inform the data subject in writing of the purpose of data collection, the right to access and correct data, and the categories of third parties to whom data may be disclosed. Consent must be obtained.",
  },
  {
    id: "law-pdpa-004",
    topic: "PDPA 2010",
    question:
      "What is the maximum fine for non-compliance with the PDPA 2010?",
    options: [
      "RM50,000",
      "RM100,000",
      "RM300,000",
      "RM500,000",
    ],
    answer: "RM500,000",
    explanation:
      "Non-compliance with certain provisions of the PDPA 2010 can result in fines up to RM500,000 and/or imprisonment up to 3 years. The severity depends on the specific provision violated.",
  },
  {
    id: "law-pdpa-005",
    topic: "PDPA 2010",
    question:
      "What constitutes 'sensitive personal data' under the PDPA 2010?",
    options: [
      "Only financial data like bank account numbers",
      "Physical or mental health, political opinions, religious beliefs, criminal offences, and other data as prescribed",
      "Only biometric data like fingerprints",
      "Any data that is encrypted",
    ],
    answer: "Physical or mental health, political opinions, religious beliefs, criminal offences, and other data as prescribed",
    explanation:
      "Section 4 of the PDPA 2010 defines sensitive personal data as data relating to physical/mental health, political opinions, religious beliefs or other beliefs, commission of any offence, and any other data as determined by the Minister. Processing sensitive data requires explicit consent.",
  },
];
