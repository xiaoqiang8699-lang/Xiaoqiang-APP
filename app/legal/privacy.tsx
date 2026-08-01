import { LegalDocumentScreen } from '@/components/legal-document-screen';
import { LegalCopy, PrivacyPolicyBody } from '@/constants/legal';

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen title={LegalCopy.privacyTitle} body={PrivacyPolicyBody} />;
}
