import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Link to="/auth">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
        
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              ReubenAI Safety, Privacy & Cookie Policy
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              Last updated: 7 August 2025
            </p>
            <p className="text-center text-lg mt-4">
              Welcome to ReubenAI — an AI-native platform for private capital workflows. We are committed to protecting your privacy, securing your data, and being transparent about how our platform operates.
            </p>
            <p className="text-center font-medium mt-2">
              Please read the following policies carefully.
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Your Data & Privacy</h2>
              <p className="mb-4">
                ReubenAI is built with privacy by design. We collect and process only the data necessary to deliver a secure and intelligent experience for our users.
              </p>
              
              <div className="space-y-3">
                <p><strong>Data Ownership:</strong> You retain full ownership of any deals, memos, notes, and content uploaded to the platform.</p>
                
                <p><strong>Usage Transparency:</strong> We will never sell or share your data with third parties without your explicit permission.</p>
                
                <p><strong>Compliance:</strong> We comply with the Australian Privacy Act 1988 (Cth) and, where applicable, the General Data Protection Regulation (GDPR) for international users.</p>
              </div>
              
              <p className="mt-4">
                For more information or data access requests, contact us at <a href="mailto:support@goreuben.com" className="text-primary hover:underline">support@goreuben.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. AI Disclaimers & Human Oversight</h2>
              <p className="mb-4">
                ReubenAI leverages artificial intelligence to support deal sourcing, scoring, memo generation, and more. While we strive for accuracy and relevance, all outputs should be reviewed by your team.
              </p>
              
              <div className="space-y-3">
                <p><strong>AI Assistance Only:</strong> The platform is intended to augment — not replace — professional investment judgment.</p>
                
                <p><strong>Limitations:</strong> AI-generated content may contain errors or miss nuanced contextual factors.</p>
                
                <p className="font-medium text-orange-600 dark:text-orange-400">
                  Do not rely solely on AI-generated outputs for investment decisions.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
              <p className="mb-4">We implement rigorous security measures to protect your information:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>End-to-end encryption (in transit and at rest)</li>
                <li>Multi-factor authentication</li>
                <li>Role-based access controls</li>
                <li>Regular security audits</li>
              </ul>
              
              <p className="mt-4">
                Our infrastructure is hosted on leading privacy-compliant cloud platforms with industry-standard certifications (e.g. ISO 27001).
              </p>
              
              <p className="mt-4">
                If you identify a security concern, please contact us at <a href="mailto:support@goreuben.com" className="text-primary hover:underline">support@goreuben.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Cookies & Website Tracking</h2>
              <p className="mb-4">
                When you visit goreuben.com, we may use cookies and similar tracking technologies to improve user experience and understand platform performance.
              </p>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">What we use cookies for:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Site functionality (e.g. remembering your login)</li>
                  <li>Analytics (e.g. Google Analytics, Hotjar)</li>
                  <li>Improving future features based on usage patterns</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Your choices:</h3>
                <p>You can disable cookies via your browser settings. However, doing so may affect some platform features.</p>
                <p className="mt-2">By using our website, you consent to the use of cookies in accordance with this policy.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Beta Participation Disclaimer</h2>
              <p className="mb-4">ReubenAI is currently in private beta. As such:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>Features are subject to change without notice</li>
                <li>Data may be adjusted or removed as we refine the product</li>
                <li>Performance may vary and occasional downtime is possible</li>
              </ul>
              
              <p className="mt-4">
                We appreciate your participation and feedback as we build toward public launch.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Third-Party Integrations</h2>
              <p className="mb-4">
                To enrich your experience, ReubenAI integrates with trusted third-party APIs (e.g., Crunchbase, LinkedIn, OpenAI). Where these services process data, they do so under their own privacy terms.
              </p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>We never sell your information</li>
                <li>We do not use data brokers</li>
                <li>We disclose third-party usage clearly inside the platform</li>
              </ul>
              
              <p className="mt-4">
                By using ReubenAI, you acknowledge and accept our use of third-party integrations where relevant.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. User Responsibilities</h2>
              <p className="mb-4">As a ReubenAI user, you are responsible for ensuring that:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>You have the right to upload or input any information into the platform</li>
                <li>Your use complies with your own company's confidentiality obligations</li>
                <li>You do not input sensitive personal data (e.g., health records, government IDs) unless necessary</li>
              </ul>
              
              <p className="mt-4">
                ReubenAI is a professional tool — please use it responsibly and ethically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p>For any questions, feedback, or privacy-related requests, please email:</p>
              <p className="mt-2">
                <a href="mailto:support@goreuben.com" className="text-primary hover:underline font-medium text-lg">
                  support@goreuben.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}