import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Spinner,
  useToast,
  Checkbox,
  Text,
} from "@chakra-ui/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { NdaService } from "../services/api/ndaService";

interface NDADocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ndaMetadata: any;
  onAccept: () => void;
}

const NDADocumentModal: React.FC<NDADocumentModalProps> = ({
  isOpen,
  onClose,
  ndaMetadata,
  onAccept,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const apiCalledRef = useRef<boolean>(false);
  const { citizen } = useAuthSession();

  const generateNdaPDF = async () => {
    if (apiCalledRef.current || loading) return;
    
    apiCalledRef.current = true;
    setLoading(true);
    
    const loadingToastId = toast({
      title: "Generating NDA Document",
      description: "Please wait while we prepare your NDA document...",
      status: "loading",
      duration: null,
      isClosable: false,
    });
    
    try {
      const responseBlob = await NdaService.generateNdaPdfBlob(ndaMetadata);
      toast.close(loadingToastId);
      
      const blob = new Blob([responseBlob], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      toast({
        title: "Document Ready",
        description: "Your NDA document has been generated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error generating NDA PDF:", error);
      toast.close(loadingToastId);
      const errorMessage = (error as Error)?.message || "Failed to generate NDA PDF.";
      toast({ title: "Error", description: errorMessage, status: "error", duration: 4000, isClosable: true });
      apiCalledRef.current = false;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && ndaMetadata && !pdfUrl) {
      generateNdaPDF();
    }
    if (!isOpen) {
      apiCalledRef.current = false;
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [isOpen, ndaMetadata]);

  const downloadPDF = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "NDA.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleAcceptNda = async () => {
    if (!confirmed) {
      toast({ title: "Confirm NDA Acceptance", description: "Please check the box to confirm your NDA.", status: "warning" });
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const resData = await NdaService.acceptNda();
      if (resData === "Approved" || resData === "Already Approved") {
        toast({ title: "NDA Accepted", description: "Your NDA has been accepted. Access granted.", status: "success" });
        onAccept();
        setTimeout(() => onClose(), 100);
      }
    } catch (error: any) {
      console.error("Error accepting NDA:", error);
      toast({ title: "Error", description: error.response?.data || "Could not accept NDA.", status: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryGeneratePDF = () => {
    apiCalledRef.current = false;
    setPdfUrl(null);
    generateNdaPDF();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>NDA Document</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto" maxH="70vh">
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" />
              <Text mt={4}>Generating NDA document, please wait...</Text>
            </Box>
          ) : pdfUrl ? (
            <Box width="100%" height="500px" overflow="hidden">
              <iframe
                src={pdfUrl}
                title="NDA Document"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <Text mb={4}>No document available.</Text>
              <Button onClick={handleRetryGeneratePDF} colorScheme="blue">
                Retry PDF Generation
              </Button>
            </Box>
          )}
          <Box mt={4}>
            <Checkbox
              isChecked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            >
              I confirm that I have read and accept the terms of the NDA.
            </Checkbox>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={downloadPDF} colorScheme="blue" mr={4} isDisabled={!pdfUrl}>
            Download PDF
          </Button>
          <Button isLoading={isSubmitting} onClick={handleAcceptNda} colorScheme="blue" isDisabled={!pdfUrl || !confirmed}>
            Accept NDA
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NDADocumentModal;
