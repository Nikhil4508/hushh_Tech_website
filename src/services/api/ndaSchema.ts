import { z } from "zod";

export const InvestorTypeSchema = z.enum(["Individual", "Organisation"]);

export const IndividualSchema = z.object({
  name: z.string().min(1, "Full Name is required."),
  state: z.string().min(1, "State for taxation is required."),
  city: z.string().min(1, "City for taxation is required."),
  country: z.string().min(1, "Country for taxation is required."),
  individual_address: z.string().min(1, "Residential Address is required."),
  legal_email: z.string().email("Invalid email format."),
  mobile_telephone: z.string().min(5, "Mobile Telephone is required."), // Basic length check for phone
});

export const OrganisationSchema = z.object({
  company_name: z.string().min(1, "Company Name is required."),
  state_of_incorporation: z.string().min(1, "State of Incorporation is required."),
  company_address: z.string().optional(),
  company_email: z.string().email("Invalid company email format."),
  contact_person_name: z.string().min(1, "Contact Person Name is required."),
  contact_person_title: z.string().min(1, "Contact Person Title is required."),
  contact_person_email: z.string().email("Invalid contact person email format."),
  contact_person_telephone: z.string().min(5, "Contact Person Telephone is required."),
});

export const NdaRequestSchema = z.discriminatedUnion("investorType", [
  z.object({
    investorType: z.literal("Individual"),
    metadata: IndividualSchema,
  }),
  z.object({
    investorType: z.literal("Organisation"),
    metadata: OrganisationSchema,
  }),
]);

export type IndividualData = z.infer<typeof IndividualSchema>;
export type OrganisationData = z.infer<typeof OrganisationSchema>;
export type NdaRequestData = z.infer<typeof NdaRequestSchema>;
