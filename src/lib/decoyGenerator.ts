export interface DecoyData {
  type:
    | "credit_card"
    | "ssn"
    | "bank_account"
    | "verification_code"
    | "insurance_policy"
    | "personal_info"
    | "date_of_birth";
  displayText: string;
  rawData: {
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    ssn?: string;
    accountNumber?: string;
    routingNumber?: string;
    code?: string;
    policyNumber?: string;
    groupNumber?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    age?: number;
  };
}

function generateFakeCreditCard(): {
  number: string;
  expiry: string;
  cvv: string;
} {
  // Common card prefixes: Visa (4), Mastercard (5), Amex (37), Discover (6)
  const prefixes = ["4", "5", "37", "6"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  let cardNumber = prefix;
  const targetLength = prefix === "37" ? 15 : 16;

  while (cardNumber.length < targetLength) {
    cardNumber += Math.floor(Math.random() * 10);
  }

  // Format with spaces (4-4-4-4 or 4-6-5 for Amex)
  const formatted =
    prefix === "37"
      ? `${cardNumber.slice(0, 4)} ${cardNumber.slice(
          4,
          10
        )} ${cardNumber.slice(10)}`
      : `${cardNumber.slice(0, 4)} ${cardNumber.slice(4, 8)} ${cardNumber.slice(
          8,
          12
        )} ${cardNumber.slice(12)}`;

  // Generate expiry (random future date)
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const year = String(25 + Math.floor(Math.random() * 8)); // 2025-2032
  const expiry = `${month}/${year}`;

  // Generate CVV (3 or 4 digits)
  const cvvLength = prefix === "37" ? 4 : 3;
  const cvv = String(
    Math.floor(Math.random() * Math.pow(10, cvvLength))
  ).padStart(cvvLength, "0");

  return { number: formatted, expiry, cvv };
}

function generateFakeSSN(): string {
  const area = String(Math.floor(Math.random() * 899) + 100); // 100-999 (avoid 000, 666, 900-999)
  const group = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0"); // 01-99
  const serial = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0"); // 0001-9999
  return `${area}-${group}-${serial}`;
}

function generateFakeBankAccount(): { account: string; routing: string } {
  const routing = String(Math.floor(Math.random() * 900000000) + 100000000); // 9 digits
  const account = String(Math.floor(Math.random() * 9000000000) + 1000000000); // 10 digits
  return { account, routing };
}

function generateFakeVerificationCode(): string {
  return String(Math.floor(Math.random() * 900000) + 100000); // 6 digits
}

function generateFakeInsurancePolicy(): { policy: string; group: string } {
  // Format: ABC-123456789-01
  const prefix =
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const main = String(Math.floor(Math.random() * 900000000) + 100000000);
  const suffix = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
  const policy = `${prefix}-${main}-${suffix}`;

  // Group number format: GRP-12345
  const group = `GRP-${String(Math.floor(Math.random() * 90000) + 10000)}`;

  return { policy, group };
}

function generateFakeName(): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const firstNames = [
    "James",
    "Michael",
    "Robert",
    "John",
    "David",
    "William",
    "Richard",
    "Joseph",
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Barbara",
    "Susan",
    "Jessica",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;

  return { firstName, lastName, fullName };
}

function generateFakeDOB(): { dateOfBirth: string; age: number } {
  // Generate DOB for someone between 25-65 years old
  const age = Math.floor(Math.random() * 40) + 25;
  const year = new Date().getFullYear() - age;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  const dateOfBirth = `${month}/${day}/${year}`;

  return { dateOfBirth, age };
}

export function suggestDecoyType(
  personaGoal: string,
  lastAIMessage?: string
): DecoyData["type"] | null {
  const context = `${personaGoal} ${lastAIMessage || ""}`.toLowerCase();

  // Priority order: match specific request first
  if (
    context.includes("name") ||
    context.includes("full name") ||
    context.includes("first name") ||
    context.includes("last name") ||
    context.includes("who am i speaking with") ||
    context.includes("may i have your name")
  ) {
    return "personal_info";
  }

  if (
    context.includes("date of birth") ||
    context.includes("birthday") ||
    context.includes("birth date") ||
    context.includes("dob") ||
    context.includes("age") ||
    context.includes("when were you born")
  ) {
    return "date_of_birth";
  }

  if (
    context.includes("insurance") ||
    context.includes("policy number") ||
    context.includes("group number") ||
    context.includes("member id")
  ) {
    return "insurance_policy";
  }

  if (
    context.includes("credit card") ||
    context.includes("card number") ||
    context.includes("cvv") ||
    context.includes("expir") ||
    context.includes("payment")
  ) {
    return "credit_card";
  }

  if (
    context.includes("ssn") ||
    context.includes("social security") ||
    context.includes("tax id") ||
    context.includes("identification number")
  ) {
    return "ssn";
  }

  if (
    context.includes("bank account") ||
    context.includes("account number") ||
    context.includes("routing") ||
    context.includes("direct deposit")
  ) {
    return "bank_account";
  }

  if (
    context.includes("verification code") ||
    context.includes("confirm") ||
    context.includes("code") ||
    context.includes("otp") ||
    context.includes("pin")
  ) {
    return "verification_code";
  }

  return null; // No specific match, let caller decide
}

export function generateDecoyData(specificType?: DecoyData["type"]): DecoyData {
  const types: DecoyData["type"][] = [
    "credit_card",
    "ssn",
    "bank_account",
    "verification_code",
    "insurance_policy",
    "personal_info",
    "date_of_birth",
  ];
  const randomType =
    specificType || types[Math.floor(Math.random() * types.length)];

  switch (randomType) {
    case "personal_info": {
      const name = generateFakeName();
      return {
        type: "personal_info",
        displayText: `> DECOY_NAME: ${name.fullName}`,
        rawData: {
          fullName: name.fullName,
          firstName: name.firstName,
          lastName: name.lastName,
        },
      };
    }

    case "date_of_birth": {
      const dob = generateFakeDOB();
      return {
        type: "date_of_birth",
        displayText: `> DECOY_DOB: ${dob.dateOfBirth} (Age: ${dob.age})`,
        rawData: {
          dateOfBirth: dob.dateOfBirth,
          age: dob.age,
        },
      };
    }

    case "credit_card": {
      const cc = generateFakeCreditCard();
      return {
        type: "credit_card",
        displayText: `> DECOY_CC: ${cc.number} | EXP: ${cc.expiry} | CVV: ${cc.cvv}`,
        rawData: {
          cardNumber: cc.number,
          expiry: cc.expiry,
          cvv: cc.cvv,
        },
      };
    }

    case "ssn": {
      const ssn = generateFakeSSN();
      return {
        type: "ssn",
        displayText: `> DECOY_SSN: ${ssn}`,
        rawData: { ssn },
      };
    }

    case "bank_account": {
      const bank = generateFakeBankAccount();
      return {
        type: "bank_account",
        displayText: `> DECOY_ACCOUNT: ${bank.account} | ROUTING: ${bank.routing}`,
        rawData: {
          accountNumber: bank.account,
          routingNumber: bank.routing,
        },
      };
    }

    case "verification_code": {
      const code = generateFakeVerificationCode();
      return {
        type: "verification_code",
        displayText: `> DECOY_VERIFICATION_CODE: ${code}`,
        rawData: { code },
      };
    }

    case "insurance_policy": {
      const insurance = generateFakeInsurancePolicy();
      return {
        type: "insurance_policy",
        displayText: `> DECOY_INSURANCE: ${insurance.policy} | GROUP: ${insurance.group}`,
        rawData: {
          policyNumber: insurance.policy,
          groupNumber: insurance.group,
        },
      };
    }
  }
}

export function formatDecoyForAI(decoy: DecoyData): string {
  switch (decoy.type) {
    case "personal_info":
      return `User provided name: ${decoy.rawData.fullName}`;
    case "date_of_birth":
      return `User provided date of birth: ${decoy.rawData.dateOfBirth} (age ${decoy.rawData.age})`;
    case "credit_card":
      return `User provided credit card: ${decoy.rawData.cardNumber}, expiry ${decoy.rawData.expiry}, CVV ${decoy.rawData.cvv}`;
    case "ssn":
      return `User provided SSN: ${decoy.rawData.ssn}`;
    case "bank_account":
      return `User provided bank account ${decoy.rawData.accountNumber}, routing ${decoy.rawData.routingNumber}`;
    case "verification_code":
      return `User provided verification code: ${decoy.rawData.code}`;
    case "insurance_policy":
      return `User provided insurance policy number: ${decoy.rawData.policyNumber}, group number: ${decoy.rawData.groupNumber}`;
  }
}
