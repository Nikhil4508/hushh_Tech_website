import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  VStack,
  HStack,
  useToast,
  Radio,
  RadioGroup,
  Input,
  Flex,
  Checkbox,
} from "@chakra-ui/react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { NdaService } from "../services/api/ndaService";
import { NdaRequestSchema } from "../services/api/ndaSchema";

interface NDARequestModalProps {
  onSubmit: (result: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Format a given phone number string into international format
const formatPhoneNumber = (phone: string): string => {
  if (!phone.startsWith("+")) {
    phone = `+${phone}`;
  }
  const phoneNumber = parsePhoneNumberFromString(phone);
  return phoneNumber ? phoneNumber.formatInternational() : phone;
};

const InvestorProfilePage: React.FC<NDARequestModalProps> = ({
  onSubmit,
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [investorType, setInvestorType] = useState<"Individual" | "Organisation">("Individual");
  const [metadata, setMetadata] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [ndaConfirmed, setNdaConfirmed] = useState(false);
  const [ndaTermsAccepted, setNdaTermsAccepted] = useState(false);
  const toast = useToast();

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setMetadata((prev: any) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prevErrors) => {
        const next = { ...prevErrors };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep1 = () => {
    // Basic formatting for phone before validation
    const dataToValidate = { ...metadata };
    if (dataToValidate.mobile_telephone) {
      dataToValidate.mobile_telephone = formatPhoneNumber(dataToValidate.mobile_telephone);
    }
    if (dataToValidate.contact_person_telephone) {
      dataToValidate.contact_person_telephone = formatPhoneNumber(dataToValidate.contact_person_telephone);
    }

    const result = NdaRequestSchema.safeParse({
      investorType,
      metadata: dataToValidate,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[issue.path.length - 1];
        if (path) errors[path.toString()] = issue.message;
      });
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const goToStep = (step: number) => {
    if (step === 2 && !validateStep1()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form before proceeding.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    if (currentStep === 1 && !validateStep1()) {
      toast({ title: "Error", description: "Please complete investor profile first.", status: "error" });
      return;
    }

    if (!ndaConfirmed || !ndaTermsAccepted) {
      toast({ title: "NDA Acceptance Required", description: "Please confirm and accept NDA terms.", status: "warning" });
      return;
    }

    const formattedMetadata = { ...metadata };
    if (formattedMetadata.mobile_telephone) {
      formattedMetadata.mobile_telephone = formatPhoneNumber(formattedMetadata.mobile_telephone);
    }
    if (formattedMetadata.contact_person_telephone) {
      formattedMetadata.contact_person_telephone = formatPhoneNumber(formattedMetadata.contact_person_telephone);
    }

    try {
      const resData = await NdaService.requestFileAccess(investorType, formattedMetadata);

      if (resData === "Approved" || (typeof resData === "string" && resData.startsWith("Requested permission"))) {
        toast({ title: "Request Submitted", description: "Your access request has been sent and is pending approval.", status: "success", duration: 4000, isClosable: true });
        window.location.href = "/";
        handleClose();
      } else if (resData === "Rejected") {
        toast({ title: "Request Rejected", description: "Your request was rejected. Please re-apply after 2-3 days.", status: "error", duration: 4000, isClosable: true });
      } else if (resData === "Pending") {
        toast({ title: "Request Pending", description: "Your request is still under review.", status: "info", duration: 4000, isClosable: true });
        onSubmit(resData);
      } else if (resData === "Pending: Waiting for NDA Process") {
        toast({ title: "NDA Process Required", description: "Please complete the NDA process to proceed.", status: "warning", duration: 4000, isClosable: true });
        onSubmit(resData);
        window.location.href = "/profile";
      } else {
        toast({ title: "Unexpected Response", description: `Received: ${resData}`, status: "error", duration: 4000, isClosable: true });
        onSubmit(resData);
      }
    } catch (error: any) {
      console.error("Error submitting request:", error);
      const errorMessage = error.response?.data?.message || error.response?.data || "Could not submit your NDA request.";
      toast({ title: "Submission Failed", description: errorMessage, status: "error", duration: 4000, isClosable: true });
    }
  };

  const renderStepIndicator = () => {
    return (
      <Flex justify="center" align="center" my={8}>
        <Box 
          w="40px" 
          h="40px" 
          borderRadius="full" 
          background={currentStep >= 1 ? "linear-gradient(to right, #00A9E0, #6DD3EF)" : "gray.200"}
          color="white" 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          fontWeight="500"
        >
          1
        </Box>
        <Box w="60px" h="1px" bg={currentStep >= 2 ? "#1CADBC" : "gray.200"} />
        <Box 
          w="40px" 
          h="40px" 
          borderRadius="full" 
          background={currentStep >= 2 ? "linear-gradient(to right, #00A9E0, #6DD3EF)" : "gray.200"} 
          color="white" 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          fontWeight="500"
        >
          2
        </Box>
      </Flex>
    );
  };

  const renderFormStep1 = () => {
    return (
      <VStack spacing={6} align="stretch" w="100%" maxW="600px" mx="auto">
        <FormControl isRequired>
          <FormLabel fontWeight="medium" fontSize={'xl'} color="gray.700">Investor Type</FormLabel>
          <RadioGroup onChange={(value) => { setInvestorType(value as "Individual" | "Organisation"); setMetadata({}); setFormErrors({}); }} value={investorType} mt={2}>
            <HStack spacing={6}>
              <Radio value="Individual" colorScheme="cyan" size="md"><Text ml={1}>Individual</Text></Radio>
              <Radio value="Organisation" colorScheme="cyan" size="md"><Text ml={1}>Organisation</Text></Radio>
            </HStack>
          </RadioGroup>
        </FormControl>

        {investorType === "Individual" ? (
          <Box>
            <Heading as="h3" size="md" fontWeight="medium" color="gray.800" mt={6} mb={4}>Individual Information</Heading>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.name}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Full Name</FormLabel>
                  <Input size="md" placeholder="Enter your full name" value={metadata.name || ''} onChange={(e) => handleInputChange("name", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.state}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">State Registered for Taxation</FormLabel>
                  <Input size="md" placeholder="Enter your state for taxation" value={metadata.state || ''} onChange={(e) => handleInputChange("state", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.state}</FormErrorMessage>
                </FormControl>
              </HStack>
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.city}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">City Registered for Taxation</FormLabel>
                  <Input size="md" placeholder="Enter your city for taxation" value={metadata.city || ''} onChange={(e) => handleInputChange("city", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.city}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.country}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Country Registered for Taxation</FormLabel>
                  <Input size="md" placeholder="Enter your country for taxation" value={metadata.country || ''} onChange={(e) => handleInputChange("country", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.country}</FormErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isRequired isInvalid={!!formErrors.individual_address}>
                <FormLabel className="text-lg font-medium text-[#1D1D1F]">Residential Address</FormLabel>
                <Input size="md" placeholder="Enter your address" value={metadata.individual_address || ''} onChange={(e) => handleInputChange("individual_address", e.target.value)} borderColor="gray.300" bg="white" />
                <FormErrorMessage>{formErrors.individual_address}</FormErrorMessage>
              </FormControl>
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.legal_email}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Legal Email</FormLabel>
                  <Input size="md" type="email" placeholder="Enter your legal email" value={metadata.legal_email || ''} onChange={(e) => handleInputChange("legal_email", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.legal_email}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.mobile_telephone}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Mobile Telephone</FormLabel>
                  <PhoneInput country={"in"} value={metadata.mobile_telephone || ""} onChange={(phone) => handleInputChange("mobile_telephone", phone)} inputStyle={{ width: "100%", height: "40px", fontSize: "1rem", borderColor: "#E2E8F0", backgroundColor: "white" }} containerStyle={{ width: "100%" }} />
                  <FormErrorMessage>{formErrors.mobile_telephone}</FormErrorMessage>
                </FormControl>
              </HStack>
            </VStack>
          </Box>
        ) : (
          <Box>
            <Heading as="h3" size="md" fontWeight="medium" color="gray.800" mt={6} mb={4}>Organisation Information</Heading>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.company_name}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Company Name</FormLabel>
                  <Input size="md" placeholder="Enter company name" value={metadata.company_name || ''} onChange={(e) => handleInputChange("company_name", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.company_name}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.state_of_incorporation}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">State of Incorporation</FormLabel>
                  <Input size="md" placeholder="Enter state of incorporation" value={metadata.state_of_incorporation || ''} onChange={(e) => handleInputChange("state_of_incorporation", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.state_of_incorporation}</FormErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isInvalid={!!formErrors.company_address}> {/* Not required, but can still have other validation if needed */}
                <FormLabel className="text-lg font-medium text-[#1D1D1F]">Company Address</FormLabel>
                <Input size="md" placeholder="Enter company address" value={metadata.company_address || ''} onChange={(e) => handleInputChange("company_address", e.target.value)} borderColor="gray.300" bg="white" />
                <FormErrorMessage>{formErrors.company_address}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!formErrors.company_email}>
                <FormLabel className="text-lg font-medium text-[#1D1D1F]">Company Email</FormLabel>
                <Input size="md" type="email" placeholder="Enter company email" value={metadata.company_email || ''} onChange={(e) => handleInputChange("company_email", e.target.value)} borderColor="gray.300" bg="white" />
                <FormErrorMessage>{formErrors.company_email}</FormErrorMessage>
              </FormControl>

              <Heading as="h3" size="md" fontWeight="medium" color="gray.800" mt={4} mb={2}>Contact Person Information</Heading>
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.contact_person_name}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Contact Person Name</FormLabel>
                  <Input size="md" placeholder="Enter contact person name" value={metadata.contact_person_name || ''} onChange={(e) => handleInputChange("contact_person_name", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.contact_person_name}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.contact_person_title}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Contact Person Title</FormLabel>
                  <Input size="md" placeholder="Enter contact person title" value={metadata.contact_person_title || ''} onChange={(e) => handleInputChange("contact_person_title", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.contact_person_title}</FormErrorMessage>
                </FormControl>
              </HStack>
              <HStack spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.contact_person_email}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Contact Person Email</FormLabel>
                  <Input size="md" type="email" placeholder="Enter contact person email" value={metadata.contact_person_email || ''} onChange={(e) => handleInputChange("contact_person_email", e.target.value)} borderColor="gray.300" bg="white" />
                  <FormErrorMessage>{formErrors.contact_person_email}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!formErrors.contact_person_telephone}>
                  <FormLabel className="text-lg font-medium text-[#1D1D1F]">Contact Person Telephone</FormLabel>
                  <PhoneInput country={"in"} value={metadata.contact_person_telephone || ""} onChange={(phone) => handleInputChange("contact_person_telephone", phone)} inputStyle={{ width: "100%", height: "40px", fontSize: "1rem", borderColor: "#E2E8F0", backgroundColor: "white" }} containerStyle={{ width: "100%" }} />
                  <FormErrorMessage>{formErrors.contact_person_telephone}</FormErrorMessage>
                </FormControl>
              </HStack>
            </VStack>
          </Box>
        )}

        <Button onClick={() => goToStep(2)} background="linear-gradient(to right, #00A9E0, #6DD3EF)" size="md" width="full" _hover={{ background: "linear-gradient(to right, #00A9E0, #6DD3EF)" }} mt={6} py={6} color="white" borderRadius="md">
          Continue to NDA Review
        </Button>
      </VStack>
    );
  };

  const renderFormStep2 = () => {
    return (
      <VStack spacing={6} align="stretch" w="100%" maxW="600px" mx="auto">
        <Heading as="h3" fontSize={'2xl'} className="font-medium text-[#1D1D1F] mb-12 text-center" mb={2}>
          Review and Sign Non-Disclosure Agreement
        </Heading>
        <Text fontSize="sm" color="gray.600" mb={4}>
          Please review the Non-Disclosure Agreement below:
        </Text>
        
        <Box 
          border="1px solid" 
          borderColor="gray.300"
          borderRadius="md"
          p={4}
          height="300px"
          overflowY="scroll"
          bg="white"
          className="whitespace-pre-wrap text-sm text-[#1D1D1F] font-mono leading-relaxed"
        >
          <Text fontWeight="500" mb={2}>MUTUAL NON-DISCLOSURE AGREEMENT</Text>
          <Text fontSize="sm">
            Hushh Technologies and {investorType} desire to engage in discussions regarding a potential agreement or other transaction between the parties (the "Purpose"). In connection with such discussions, the parties may disclose to each other certain confidential information or materials.
          </Text>
          <Text fontSize="sm" mt={2}>
            In consideration of the foregoing, the parties agree as follows:
          </Text>
          
          <Text fontSize="sm" fontWeight="500" mt={4}>1. CONFIDENTIAL INFORMATION</Text>
          <Text fontSize="sm" mt={2}>
            For purposes of this Agreement, "Confidential Information" of a party means any information or materials disclosed by or on behalf of that party to the other party that: (a) if disclosed in writing or in the form of tangible materials, is marked "confidential" or "proprietary" or with a similar designation at the time of such disclosure; (b) if disclosed orally or presented visually, is identified as "confidential" or "proprietary" at the time of such disclosure, and is summarized in a writing sent by the disclosing party to the receiving party within thirty (30) days after any such disclosure; or (c) due to its nature or the circumstances of its disclosure, a person exercising reasonable business judgment would understand to be confidential or proprietary. The existence of this Agreement, the Purpose, and the fact that the parties are engaged in discussions with respect thereto will be deemed Confidential Information of each party.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>2. OBLIGATIONS AND RESTRICTIONS</Text>
          <Text fontSize="sm" mt={2}>
            Each party agrees: (a) to maintain the other party's Confidential Information in strict confidence, and protect and safeguard it using at least the same degree of care as it uses to protect the confidentiality of its own confidential information of similar importance, but no less than a commercially reasonable degree of care; (b) not to disclose such Confidential Information to any third party; and (c) not to use such Confidential Information for any purpose other than the Purpose. Each party may disclose the other party's Confidential Information to its employees and consultants who have a bona fide need to know such Confidential Information solely for, and only to the extent necessary to pursue, the Purpose; provided that each such employee and consultant is bound by a written agreement that contains non-use and confidentiality obligations at least as protective of the other party's Confidential Information as those set forth in this Agreement.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>3. EXCEPTIONS</Text>
          <Text fontSize="sm" mt={2}>
            The obligations and restrictions in Section 2 will not apply to any information or materials to the extent that the receiving party can demonstrate through written evidence that such information or materials:
          </Text>
          <VStack align="start" spacing={1} pl={4} mt={2}>
            <Text fontSize="sm">(a) were, at the date of disclosure, or have subsequently become, generally known or available to the public through no act or failure to act by the receiving party;</Text>
            <Text fontSize="sm">(b) were rightfully known by the receiving party without restriction as to use or disclosure prior to receiving such information or materials from the disclosing party;</Text>
            <Text fontSize="sm">(c) are rightfully acquired by the receiving party from a third party who has the right to disclose such information or materials without breach of any obligation of confidentiality or restricted use to the disclosing party; or</Text>
            <Text fontSize="sm">(d) are independently developed by the receiving party without access to any Confidential Information of the disclosing party.</Text>
          </VStack>

          <Text fontSize="sm" fontWeight="500" mt={4}>4. COMPELLED DISCLOSURE</Text>
          <Text fontSize="sm" mt={2}>
            Nothing in this Agreement will be deemed to restrict a party from disclosing the other party's Confidential Information to the extent required by any order, subpoena, law, statute or regulation, provided that the party required to make such a disclosure uses reasonable efforts to give the other party sufficient advance notice to enable the other party to prevent or limit such disclosure. The receiving party shall disclose no more than that portion of the Confidential Information which such order, subpoena, law, statute or regulation specifically requires the receiving party to disclose.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>5. RETURN OF CONFIDENTIAL INFORMATION</Text>
          <Text fontSize="sm" mt={2}>
            Upon the completion or abandonment of the Purpose, or earlier upon the disclosing party's written request, the receiving party will promptly return to the disclosing party or, at the disclosing party's option, destroy (as confirmed by written certification of destruction), all tangible items and embodiments containing or consisting of the disclosing party's Confidential Information and all copies thereof (including electronic copies), and any notes, analyses, compilations, studies, interpretations, memoranda or other documents (regardless of the form thereof) prepared by or on behalf of the receiving party that contain or are based upon the disclosing party's Confidential Information.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>6. NO OBLIGATIONS</Text>
          <Text fontSize="sm" mt={2}>
            Each party retains the right, in its sole discretion, to determine whether to disclose any Confidential Information to the other party. This agreement imposes no obligation on either party to negotiate or enter into any other agreements or arrangements with the other party, whether or not related to the Purpose.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>7. NO LICENSE</Text>
          <Text fontSize="sm" mt={2}>
            All Confidential Information remains the sole and exclusive property of the disclosing party. Each party acknowledges and agrees that nothing in this Agreement will be construed as granting any rights to the receiving party, by license or otherwise, in or to any Confidential Information of the disclosing party, or any patent, copyright or other intellectual property or proprietary rights of the disclosing party, except for the limited right of use solely for the Purpose as specified in this Agreement.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>8. NO WARRANTY</Text>
          <Text fontSize="sm" mt={2}>
            ALL CONFIDENTIAL INFORMATION IS PROVIDED BY THE DISCLOSING PARTY "AS IS" WITHOUT EXPRESS OR IMPLIED WARRANTIES OF ANY KIND. Neither party shall have any liability to the other party resulting from the Confidential Information disclosed to the other party or for its use or any errors or omissions in it.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>9. TERM</Text>
          <Text fontSize="sm" mt={2}>
            The term of this Agreement will commence on the Effective Date and expire five (5) years thereafter, provided that either party may terminate this Agreement prior to expiration upon thirty (30) days' written notice to the other party. Notwithstanding anything to the contrary herein, each party's rights and obligations under this Agreement shall survive any expiration or termination of this Agreement for a period of five (5) years thereafter except that, as to any Confidential Information that the disclosing party maintains as a trade secret, the receiving party's obligations under Section 2 will remain in effect for as long such Confidential Information remains a trade secret.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>10. EQUITABLE RELIEF</Text>
          <Text fontSize="sm" mt={2}>
            Each party hereby agrees that the unauthorized use or disclosure of the disclosing party's Confidential Information may cause the disclosing party to incur irreparable harm and significant damages for which there may be no adequate remedy at law. Accordingly, each party agrees that the disclosing party will have the right to seek immediate equitable relief to enjoin any unauthorized use or disclosure of its Confidential Information, in addition to any other rights and remedies that it may have at law or otherwise.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>11. MISCELLANEOUS</Text>
          <Text fontSize="sm" mt={2}>
            This Agreement will be governed and construed in accordance with the laws of the State of Delaware, without giving effect to any principles of conflict of laws that would lead to the application of the laws of another jurisdiction. This Agreement is the complete and exclusive agreement between the parties with respect to its subject matter and supersedes all prior or contemporaneous agreements, communications and understandings, both oral and written, between the parties with respect to its subject matter. This Agreement may be amended or modified only by a written document executed by duly authorized representatives of both parties. If any provision of this Agreement is held invalid, illegal or unenforceable, that provision will be enforced to the maximum extent permitted by law, given the fundamental intentions of the parties, and the remaining provisions of this Agreement will remain in full force and effect. Neither party may assign or transfer any rights or obligations under this Agreement, by operation of law or otherwise, without the other party's prior written consent, and any attempted assignment without such consent will be void. Subject to the foregoing, this Agreement is binding upon and will inure to the benefit of each of the parties and their respective successors and permitted assigns. This Agreement may be executed in counterparts, each of which will be deemed an original, and all of which together will constitute one and the same instrument.
          </Text>

          <Text fontSize="sm" fontWeight="500" mt={4}>IN WITNESS WHEREOF</Text>
          <Text fontSize="sm" mt={2}>
            The parties hereto have executed this Mutual Non-Disclosure Agreement by their duly authorized officers or representatives.
          </Text>
        </Box>
 {/* Digital Signature Section */}
 <Box mt={6} pt={4} borderTop="1px solid" borderColor="gray.200">
            <Text fontSize="sm" fontWeight="500" mb={4}>Digital Signature</Text>
            
            <Flex direction={{ base: 'column', md: 'row' }} justifyContent="space-between" mb={4}>
              <Box width={{ base: '100%', md: '48%' }} mb={{ base: 4, md: 0 }}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                  Full Legal Name
                </Text>
                <Box 
                  p={2} 
                  bg="gray.50" 
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor="gray.200"
                >
                  <Text fontSize="sm">
                    {investorType === "Individual" 
                      ? metadata.name || "Not provided" 
                      : metadata.contact_person_name || "Not provided"}
                  </Text>
                </Box>
              </Box>
              
              <Box width={{ base: '100%', md: '48%' }}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                  Date
                </Text>
                <Box 
                  p={2} 
                  bg="gray.50" 
                  borderRadius="md" 
                  border="1px solid" 
                  borderColor="gray.200"
                >
                  <Text fontSize="sm">
                    {new Date().toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric'
                    })}
                  </Text>
                </Box>
              </Box>
            </Flex>
          </Box>
          
        <FormControl mt={4} isInvalid={!!formErrors.ndaConfirmed}>
          <HStack spacing={2} align="flex-start">
            <Checkbox 
              colorScheme="cyan"
              size="md"
              isChecked={ndaConfirmed}
              onChange={(e) => {
                setNdaConfirmed(e.target.checked);
                if (formErrors.ndaConfirmed) setFormErrors((prev: any) => ({...prev, ndaConfirmed: null}));
              }}
              mt={1}
            />
            <Text fontSize="sm" className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-lg text-[#1D1D1F] leading-relaxed">
              I confirm that I have read and reviewed the entire Non-Disclosure Agreement above.
            </Text>
          </HStack>
          <FormErrorMessage>{formErrors.ndaConfirmed}</FormErrorMessage>
        </FormControl>

        <FormControl mt={2} isInvalid={!!formErrors.ndaTermsAccepted}>
          <HStack spacing={2} align="flex-start">
            <Checkbox 
              colorScheme="cyan"
              size="md"
              isChecked={ndaTermsAccepted}
              onChange={(e) => {
                setNdaTermsAccepted(e.target.checked);
                if (formErrors.ndaTermsAccepted) setFormErrors((prev: any) => ({...prev, ndaTermsAccepted: null}));
              }}
              mt={1}
            />
            <Text fontSize="sm" className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-lg text-[#1D1D1F] leading-relaxed">
              By checking this box and clicking "Submit NDA & Investor Profile", I acknowledge that 
              I have read, understood, and agree to be bound by the terms and conditions of the 
              Non-Disclosure Agreement presented above. I confirm that the investor profile 
              information provided is true and accurate.
            </Text>
          </HStack>
          <FormErrorMessage>{formErrors.ndaTermsAccepted}</FormErrorMessage>
        </FormControl>

        <HStack spacing={4} mt={6}>
          <Button onClick={() => goToStep(1)} size="md" width="40%" py={6} borderRadius="md" bg="transparent" color="black" border="1px solid">
            Back to Profile
          </Button>
          <Button onClick={handleSubmit} background="linear-gradient(to right, #00A9E0, #6DD3EF)" _hover={{ background: "linear-gradient(to right, #0AADBC, #1CADBC)" }} color={'white'} size="md" width="60%" py={6} borderRadius="md" isDisabled={!ndaConfirmed || !ndaTermsAccepted}>
            Submit NDA & Investor Profile
          </Button>
        </HStack>
      </VStack>
    );
  };

  // If component is used outside of a modal context, render as before
  // If it's used as a modal, don't render when isOpen is false
  if (isOpen === false) {
    return null;
  }

  return (
    <Container maxW="container.md" py={8}>
      <Box textAlign="center" mb={4} minH="60vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Heading as="h1" size="lg" fontWeight="500">
          <Text as="span" fontSize={{md:'6xl', base:'2xl'}} className="font-light text-[#1D1D1F] mb-8 leading-tight tracking-tight">Confidentiality Agreement & </Text> <br/>
          <Text as="span" fontSize={{md:'6xl', base:'2xl'}} className="font-medium text-[#1D1D1F] mb-8 leading-tight tracking-tight blue-gradient-text">Investor Profile</Text>
        </Heading>
        <Text mt={1} className="text-xl md:text-2xl text-[#6E6E73] max-w-3xl mx-auto font-light leading-relaxed">
          Complete this form to access our investment documents and detailed information.
        </Text>
      </Box>

      {renderStepIndicator()}

      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" borderColor="gray.200" p={6} bg="white">
        {currentStep === 1 && renderFormStep1()}
        {currentStep === 2 && renderFormStep2()}
      </Box>
    </Container>
  );
};

export default InvestorProfilePage;
