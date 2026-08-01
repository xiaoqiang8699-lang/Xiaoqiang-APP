import { LegalDocumentScreen } from '@/components/legal-document-screen';
import { LegalCopy, TermsOfServiceBody } from '@/constants/legal';

export default function TermsOfServiceScreen() {
  return <LegalDocumentScreen title={LegalCopy.termsTitle} body={TermsOfServiceBody} />;
}
