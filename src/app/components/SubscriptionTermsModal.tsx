"use client";

import { useState, useEffect } from 'react';
import PortalModal from './PortalModal';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

interface SubscriptionTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionTermsModal({ isOpen, onClose }: SubscriptionTermsModalProps) {
  const { isAuthenticated, isLoading } = useKindeBrowserClient();

  const handleAccept = () => {
    sessionStorage.setItem('subscriptionTermsAccepted', 'true');
    onClose();
  };

  return (
    <PortalModal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-h-[90vh]"
    >
      <div className="p-6 flex flex-col h-[80vh]">
            <h2 className="text-xl font-bold text-[#012C61] uppercase font-lemonMilkRegular text-center mb-4">
              Subscription Terms and Conditions
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-4 text-sm text-gray-700">
              <p className="mb-4">
                Effective Date: [Insert Date]
              </p>
              <p className="mb-4">
                These Terms and Conditions govern your use of the website and the online services and materials available therein (collectively, the "Product") provided by MediRate LLC and its affiliated companies (collectively "MediRate"). The terms "you" and "your" shall mean the individual and/or entity (e.g., company, corporation, partnership, sole proprietorship, etc.) using the Product and/or entering into a Subscription Agreement with MediRate. The "Subscription Agreement" is the agreement you sign with MediRate that contains the term of your subscription and the applicable rates set forth in the Price Schedule, which is governed by these Terms and Conditions.
              </p>
              <p className="mb-4">
                Binding Arbitration. These Terms provide that all disputes between you and MediRate that in any way relate to your Subscription Agreement or these Terms and Conditions or your use of the Product will be resolved by BINDING ARBITRATION. ACCORDINGLY, YOU AGREE to GIVE UP YOUR RIGHT TO GO TO COURT (INCLUDING IN A CLASS ACTION PROCEEDING) to assert or defend your rights. Your rights will be determined by a NEUTRAL ARBITRATOR and NOT a judge or jury and your claims cannot be brought as a class action. Please review the Section below entitled Dispute Resolution; Arbitration Agreement for the details regarding your agreement to arbitrate any disputes with MediRate.
              </p>
              <h3 className="font-semibold mt-4">1. GRANT OF RIGHTS; RESTRICTIONS ON USE</h3>
              <p className="mb-4">
                1.1 You and your Authorized Users (defined below in Section 2.1) are granted a nonexclusive, nontransferable, limited right to access and use for research purposes the Product made available to you. The rights granted to each Authorized User are as follows:
              </p>
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  The right to electronically display materials retrieved from the Product (“Materials”) primarily for the Authorized User’s individual use (e.g., except for internal training and related purposes, no Authorized User may network other persons via LANs, WANs, intranets or the Internet). Notwithstanding the foregoing, an Authorized User may display a de minimis amount of the Materials on an incidental, infrequent basis for non-commercial purposes to other Authorized Users so long as the Materials are not hosted on a LAN or WAN.
                </li>
                <li>
                  The right to email, fax, download or make printouts using the commands of the Product and the right to create a single printout of Materials accessed or downloaded by any other means (collectively, “Authorized Printouts”).
                </li>
                <li>
                  With respect to all Materials, to the extent applicable, the right to download using the commands of the Product and store in machine readable form for no more than 90 days, primarily for that Authorized User’s exclusive use, a single copy of insubstantial portions of those Materials included in any individually searchable file or content source in the Product.
                </li>
                <li>
                  Notwithstanding anything to the contrary herein but subject to applicable copyright law, the right to: (1) excerpt or quote insubstantial portions of Materials in documents prepared in the ordinary course of your business; (2) distribute Authorized Printouts to persons who are not Authorized Users (through the functionality of the Product) on an occasional, infrequent basis; and (3) store Materials for periods in excess of the periods set forth above to the extent required for legal or regulatory compliance, provided all other Materials are purged promptly upon the expiration or termination of the Subscription Agreement.
                </li>
                <li>
                  Except as expressly permitted in subsections 1(c) through 1(e) above, downloading and storing Materials in a searchable database is prohibited.
                </li>
                <li>
                  The Product and the Materials are protected by copyright, intellectual property laws, and other laws that prevent unauthorized access and use. If you are not an Authorized User, you are not permitted to access or use the Product for any purpose whatsoever. If you nevertheless access and use the Product or Materials without authorization, your access and use will be governed by these Terms and Conditions, and you will be liable to MediRate for any breach thereof. Furthermore, you will be responsible for payment to MediRate with respect to such unauthorized use at the rates in the applicable Price Schedule.
                </li>
              </ol>
              <p className="mb-4">
                1.2 To the extent permitted by applicable copyright law and not further limited or prohibited by the Terms and Conditions, you and your Authorized Users may make copies of Authorized Printouts and distribute Authorized Printouts and copies.
              </p>
              <p className="mb-4">
                1.3 Except as specifically provided in Sections 1.1 and 1.2, you and your Authorized Users are prohibited from downloading, emailing, faxing, storing, reproducing, transmitting, displaying, copying, distributing, or using Materials retrieved from the Product. You may not exploit the goodwill of MediRate, including its trademarks, service marks, or logos without the express written consent of MediRate. Additionally, under no circumstances may you or any Authorized User offer any part of the Product or Materials for commercial resale or commercial redistribution in any medium nor may you or any Authorized User use the Product or the Materials to compete with the business of MediRate.
              </p>
              <p className="mb-4">
                1.4 All right, title, and interest (including all copyrights, trademarks, and other intellectual property rights) in the Product in any medium belongs to MediRate or its third-party suppliers of Materials. MediRate and the MediRate symbol are trademarks of MediRate, used under license. Neither you nor your Authorized Users acquire any proprietary interest in the Product, Materials, or copies thereof, except the limited rights granted herein.
              </p>
              <p className="mb-4">
                1.5 Neither you nor your Authorized Users may use the Product or Materials in any fashion that infringes the intellectual property rights, privacy rights or proprietary interests of MediRate or any third party. Your use of the Product must comply with all applicable laws, rules, and regulations.
              </p>
              <p className="mb-4">
                1.6 Neither you nor your Authorized Users may remove or obscure the copyright notices or other notices contained in Materials.
              </p>
              <h3 className="font-semibold mt-4">2. ACCESS TO SERVICES</h3>
              <p className="mb-4">
                2.1 Only your employees, temporary employees, students, partners, members, owners, shareholders, and contractors to the extent performing dedicated work exclusively for you (to the extent those categories of persons are appropriate to your situation) are eligible to access and use the Product (“Eligible Persons”). Without limitation, external professional service providers such as attorneys, accountants, outsourcers, and public relations firms are specifically excluded from being Eligible Persons. The term “Authorized User” means an Eligible Person whom you have identified to MediRate for purposes of issuing an MediRate ID.
              </p>
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  You agree that each MediRate ID may only be used by the Authorized User to whom MediRate assigns it and that the MediRate ID may not be shared with or used by any other person, including any other Authorized User. You will manage your roster of Authorized Users and will promptly notify MediRate to deactivate an Authorized User’s MediRate ID if the Authorized User is no longer an Eligible Person or you otherwise wish to terminate the Authorized User’s access to the Product.
                </li>
                <li>
                  You are responsible for all use of the Product accessed with MediRate IDs issued to your Authorized Users, including associated charges, whether by Authorized Users or others. You will use reasonable commercial efforts to prevent unauthorized use of MediRate IDs assigned to your Authorized Users and will promptly notify MediRate, in writing, if you suspect that an MediRate ID is lost, stolen, compromised, or misused.
                </li>
                <li>
                  You represent and warrant on an ongoing basis that you and your Authorized Users: (i) are not Sanctioned Parties; (ii) will not provide access to the Product to any Sanctioned Party; (iii) will not access the Product from a country subject to Sanctions List and/or applicable embargoes; and (iv) will not use any Sanctioned Party in any manner in connection with this Agreement. Breach of this clause shall entitle MediRate to terminate the Subscription Agreement immediately on written notice, without prejudice to any other rights available by law or contract.
                </li>
                <li>
                  As used herein “Sanctions List” means each of: (i) the OFAC list of Specially Designated Nationals (“SDN List”); (ii) the UK HM Treasury Consolidated List of Sanctions Targets; (iii) the EU Consolidated List of Persons, Groups, and Entities Subject to EU Financial Sanctions; (iv) the U.S. Department of Commerce Bureau of Industry and Security Entity List; or (v) any other applicable sanctions lists.
                </li>
                <li>
                  As used herein “Sanctioned Party” means any person (entity or individual) who is subject to sanctions or export controls imposed by the United States, United Kingdom, European Union or other applicable authority, including, but not limited to any person: (i) identified on any Sanctions List; or (ii) who is 50 percent or more owned, directly or indirectly, individually or in the aggregate, or otherwise controlled, by any person identified in clause (e)(i) hereof.
                </li>
              </ol>
              <p className="mb-4">
                2.2 Accessing or using the Product via mechanical, programmatic, robotic, scripted or any other automated means is strictly prohibited. Unless otherwise agreed to by MediRate in writing, use of the Product is permitted only via individual users engaged in an active user session and may not be collected via automated or robotic methods. Regardless of the data delivery method, neither the Product nor the Materials may be used in conjunction with a generative artificial intelligence (“AI”) solution.
              </p>
              <p className="mb-4">
                2.3 The Product is intended to be used only in the United States.
              </p>
              <p className="mb-4">
                2.4 The Product features functionality that may be enhanced, added to, withdrawn, reorganized, combined or otherwise changed by MediRate without notice.
              </p>
              <p className="mb-4">
                2.5 Some of the Product may utilize AI algorithms and technologies. MediRate may provide responsive search results based on natural language queries or prompts that Authorized Users provide while using the Product. AI systems may not always be accurate or error-free, which means Authorized Users are responsible for verifying and cross-referencing any information provided in the Product. AI is not a substitute for professional advice, including legal, medical, financial, or any other specialized advice.
              </p>
              <p className="mb-4">
                2.6 The Product and Materials are subject to the Additional Terms provided to you while using the Product, which are incorporated herein.
              </p>
              <h3 className="font-semibold mt-4">3. LIMITED WARRANTY</h3>
              <p className="mb-4">
                3.1 MediRate represents and warrants it has the right and authority to make the Product available to you and your Authorized Users as authorized expressly by the Subscription Agreement.
              </p>
              <p className="mb-4">
                3.2 EXCEPT AS OTHERWISE PROVIDED IN SECTION 3.1, THE PRODUCT IS PROVIDED ON AN “AS IS”, “AS AVAILABLE” BASIS AND MEDIRATE AND EACH THIRD-PARTY SUPPLIER OF MATERIALS EXPRESSLY DISCLAIM ALL OTHER WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
              </p>
              <h3 className="font-semibold mt-4">4. LIMITATION OF LIABILITY</h3>
              <p className="mb-4">
                4.1 A Covered Party (as defined below) shall not be liable for any loss, injury, claim, liability, or damage of any kind resulting in any way from: (a) any errors in or omissions from the Product or any Materials available or not included therein; (b) the unavailability or interruption of the Product or any features thereof or any Materials; (c) your or an Authorized User’s use of the Product or Materials; (d) the loss or corruption of any data or equipment in connection with the Product; (e) the content, accuracy, or completeness of Materials, regardless of whether you received assistance in the use of the Product from a Covered Party; (f) any delay or failure in performance beyond the reasonable control of a Covered Party, including a Force Majeure Event; or (g) any content retrieved from the Internet even if retrieved or linked to from within the Product.
              </p>
              <p className="mb-4">
                4.2 “Covered Party” means: (a) MediRate and any officer, director, employee, subcontract or, agent, successor, or assign of MediRate; and (b) each third party supplier of Materials, third party alliance entities, their affiliates, and any officer, director, employee, subcontractor, agent, successor, or assign of any third-party supplier of Materials or third party alliance entity or any of their affiliates.
              </p>
              <p className="mb-4">
                4.3 TO THE FULLEST EXTENT PERMISSIBLE BY APPLICABLE LAW, UNDER NO CIRCUMSTANCES WILL THE AGGREGATE LIABILITY OF THE COVERED PARTIES IN CONNECTION WITH ANY CLAIM ARISING OUT OF OR RELATING TO THE PRODUCT OR MATERIALS OR THE SUBSCRIPTION AGREEMENT EXCEED THE LESSER OF YOUR ACTUAL DIRECT DAMAGES OR THE AMOUNT YOU PAID FOR THE PRODUCT IN THE 12 MONTH PERIOD IMMEDIATELY PRECEDING THE DATE THE CLAIM AROSE. YOUR RIGHT TO MONETARY DAMAGES IN THAT AMOUNT SHALL BE IN LIEU OF ALL OTHER REMEDIES WHICH YOU MAY HAVE AGAINST ANY COVERED PARTY.
              </p>
              <p className="mb-4">
                4.4 TO THE FULLEST EXTENT PERMISSIBLE BY APPLICABLE LAW, NEITHER YOU NOR THE COVERED PARTIES WILL BE LIABLE FOR ANY SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY KIND WHATSOEVER (INCLUDING, WITHOUT LIMITATION, ATTORNEYS’ FEES) IN ANY WAY DUE TO, RESULTING FROM, OR ARISING IN CONNECTION WITH THE PRODUCT, MATERIALS OR THE SUBSCRIPTION AGREEMENT, OR THE FAILURE OF ANY COVERED PARTY TO PERFORM ITS OBLIGATIONS. THE FOREGOING LIMITATION OF LIABILITY SHALL NOT APPLY TO A PARTY’S INDEMNITY OBLIGATIONS OR TO CLAIMS OR DAMAGES ARISING FROM YOUR (AND YOUR AUTHORIZED USERS’) INFRINGEMENT OF INTELLECTUAL PROPERTY OR MISAPPROPRIATION OF PROPRIETARY DATA BELONGING TO MEDIRATE OR ITS THIRD-PARTY SUPPLIERS.
              </p>
              <p className="mb-4">
                4.5 Notwithstanding anything to the contrary in this Section 4: (a) If there is a breach of the warranty in Section 3.1 above, then MediRate at its option and expense, shall either defend or settle any action and indemnify and hold you harmless against proceedings or damages of any kind or description based on a third party’s claim of patent, trademark, service mark, copyright or trade secret infringement related to use of the Product or Materials, asserted against you by such third party provided: (i) all use of the Product was in accordance with the Subscription Agreement; (ii) the claim, cause of action or infringement was not caused by you modifying or combining the Product or Materials with or into other products or applications not approved by MediRate; (iii) you give MediRate prompt notice of any such claim; and (iv) you give MediRate the right to control and direct the investigation, defense and settlement of each such claim. You, at the expense of MediRate, shall reasonably cooperate with MediRate in connection with the foregoing. (b) In addition to Section 4.5(a), if the Product or the operation thereof become, or in the opinion of MediRate are likely to become, the subject of a claim of infringement, MediRate may, at its option and expense, either: (i) procure for you the right to continue using the Product; (ii) replace or modify the Product so that they become non-infringing; or (iii) if options (i) or (ii) are not reasonably available terminate the Subscription Agreement on notice to you and grant you a pro-rata refund or credit (whichever is applicable) for any pre-paid fees or fixed charges. (c) The provisions of Sections 4.5(a) and (b) shall constitute your sole and exclusive remedy for the respective matters specified therein.
              </p>
              <h3 className="font-semibold mt-4">5. MODIFICATIONS & TERMINATION</h3>
              <p className="mb-4">
                5.1 These Terms and Conditions may be changed from time to time as described below or by written agreement. Charges and payment terms may be changed in accordance with the terms of your Subscription Agreement; all other provisions may be changed by MediRate immediately upon notice to you. If any changes are made to the Subscription Agreement, such changes will: (a) only be applied prospectively; and (b) not be specifically directed against you or your Authorized Users but will apply to all similarly situated MediRate customers using the Product. You may terminate your Subscription Agreement upon written notice to MediRate if any change to the Subscription Agreement or the Terms and Conditions causes a material degradation in your access to the Product or otherwise materially adversely affects your ability to use or access the Product you were using prior to such change. For termination to be effective under this Section 5.1, written notice of termination must be provided to MediRate within 90 days of the effective date of the change, referencing this Section 5.1 and specifying in reasonable detail the facts and circumstances alleged to have caused such material degradation or materially adverse effect on access to the Product. The effective date of termination shall be 30 days after the date of such written notice of termination, provided that during such 30-day period, MediRate shall have the opportunity to cure the condition or circumstances alleged to constitute such material degradation or material adverse effect on your access to the Product. Continued use of the Product following the effective date of any change constitutes acceptance of the change but does not affect the foregoing termination right. Except as provided above, the Subscription Agreement and Terms and Conditions may not be supplemented, modified, or otherwise revised unless signed by duly authorized representatives of both parties. Furthermore, the Subscription Agreement and Terms and Conditions may not be supplemented, modified, or otherwise revised by email exchange even if the email contains a printed name or signature line bearing signature-like font. Notwithstanding anything to the contrary, MediRate shall have the right to amend the Subscription Agreement and/or Terms and Conditions (x) to comply with regulatory and/or legal requirements (and changes thereto), (y) for compliance purposes, or (z) to make ministerial or administrative changes to the Agreement, in each case of (x), (y) or (z) above, without giving rise to your right to terminate described above in this paragraph.
              </p>
              <p className="mb-4">
                5.2 MediRate may terminate the Subscription Agreement at any time with at least ten (10) days’ notice to you; provided, any pre-paid fees will be refunded. MediRate may temporarily suspend or discontinue providing access to the Product to any or all Authorized Users in breach of the Subscription Agreement and/or Terms and Conditions without notice and MediRate may pursue any other legal remedies available to it. Other than termination as specified in Section 5.1 above, you may only terminate the Subscription Agreement at the end of the term stated in the Subscription Agreement or as otherwise stated in the Subscription Agreement. If you terminate the Subscription Agreement before expiration of the term stated in the Subscription Agreement, you may owe fees through the remainder of the term, at MediRate’s option.
              </p>
              <p className="mb-4">
                5.3 Upon termination of the Subscription Agreement, your rights to use or access the Product or Materials shall cease and you and all your Authorized Users shall immediately discontinue use thereof and access thereto.
              </p>
              <h3 className="font-semibold mt-4">6. PRIVACY AND DATA SECURITY</h3>
              <p className="mb-4">
                6.1 The ability of MediRate to provide the Product is regulated by multiple privacy, data protection, and other laws in a (“Data Laws”) and by the licenses under which it obtains Materials (“Licenses”). You acknowledge that MediRate may perform periodic reviews of you and your Authorized Users’ use of the Product subject to Data Laws or Licenses (“Regulated Data”) to comply with Data Laws and license restrictions, and that the review may include asking you or your Authorized Users to verify that use of Regulated Data was for a permissible purpose. You and your Authorized Users will cooperate with MediRate in any such due diligence or regulatory review and will promptly produce all relevant records and documentation and other assistance reasonably requested by MediRate to enable MediRate to fulfill its obligations under Data Laws and Licenses. If there is any failure to cooperate with MediRate, or if any review reveals the lack of a permissible purpose to access Regulated Data, MediRate may deny access to the Product or to Regulated Data. MediRate will be under no obligation to reduce the fees payable by you to the extent that it is unable to provide Regulated Data to you based solely on your non-cooperation.
              </p>
              <p className="mb-4">
                6.2 If you, any of your Authorized Users, or any person you or your Authorized Users permits to use the Product or who gains access through an Authorized User’s failure to properly secure his or her MediRate ID or computer (a “User”) should access or use Regulated Data in an unauthorized manner (a “Security Event”), then the following provisions will apply: (a) if required by applicable law, you will notify the individuals whose information has potentially been accessed or used that a Security Event has occurred; (b) you will notify any other parties (including but not limited to regulatory entities and credit reporting agencies) as may be required by law; (c) the notification will not reference MediRate or the product through which the Regulated Data was provided, nor will MediRate be otherwise identified or referenced in connection with the Security Event, without the express written consent of MediRate; (d) you will be solely liable for all claims that may arise from a Security Event caused by you, your Authorized Users or a User and you will indemnify MediRate for any third-party claims directed against MediRate that arise from the Security Event; and (e) all notifications and indemnity claims related to the Security Event will be solely at your expense.
              </p>
              <p className="mb-4">
                6.3 You are responsible for the legality of the personal data that you or your Authorized Users provide to us. To the extent that you or your Authorized Users provide personal data to us for account registration or otherwise, the parties acknowledge and agree that we will process such information in accordance with the data protection laws, the MediRate Privacy Policy (“Privacy Policy”). Terms used but not defined in this section shall have the meanings ascribed to them in the Privacy Policy.
              </p>
              <p className="mb-4">
                <strong>6. Data Retention</strong><br />
                We retain your personal information for as long as necessary to provide the Product and fulfill the transactions you have requested, or for other essential purposes such as complying with our legal obligations, maintaining business and financial records, resolving disputes, maintaining security, detecting and preventing fraud and abuse, and enforcing our agreements. If you access the Product through a subscription administered or sponsored by your organization, we retain your organizational contact details after the termination of your organization’s subscription to continue to communicate with you.
              </p>
              <p className="mb-4">
                <strong>7. US Domestic Use Only; Locations of Processing</strong><br />
                The Product is intended to be used only in the United States. Your personal information will be stored and processed in the United States.
              </p>
              <p className="mb-4">
                <strong>8. Data Security</strong><br />
                We implement technical and organizational measures to seek to ensure a level of security appropriate to the risk to the personal information we process. These measures are aimed at ensuring the integrity, confidentiality, and availability of personal information.
              </p>
              <h3 className="font-semibold mt-4">7. MISCELLANEOUS</h3>
              <p className="mb-4">
                7.1 All notices and other communications hereunder shall be in writing or displayed electronically in the Product by MediRate. Notices shall be deemed to have been properly given on the date deposited in the mail, if mailed; on the date first made available, if displayed in the Product; or on the date received, if delivered in any other manner. Legal notices to MediRate should be sent to contact@medirate.net.
              </p>
              <p className="mb-4">
                7.2 No party will be liable for any damage, delay, or failure of performance resulting directly or indirectly from a Force Majeure Event. If a Force Majeure Event occurs, the affected party will notify the other parties and make commercially reasonable efforts to mitigate the adverse effects of the Force Majeure Event on its obligations under the Subscription Agreement. This Section 7.2 does not excuse Subscriber’s obligation to pay for Product actually received. As used herein, “Force Majeure” means: a cause which is beyond a party’s reasonable control, including fire, riot, civil disturbance, strike (other than a strike by that party’s employees), embargo, explosion, earthquake, volcanic action, flood, epidemic, pandemic, act of military authority, act of terrorism, act of God, act of the public enemy, government requirement or delay, change in law or regulation, civil or military authority, inability to secure raw materials or transportation facilities, and act or omission of a carrier or supplier.
              </p>
              <p className="mb-4">
                7.3 Dispute Resolution; Arbitration Agreement
                We will try work in good faith to resolve any issue you have with the Product if you bring that issue to the attention of our customer service department. However, we realize that there may be rare cases where we may not be able to resolve an issue to your satisfaction.
                You and MediRate agree that any dispute, claim, or controversy arising out of or relating in any way to your Subscription Agreement and the Terms and Conditions or your use of the Product shall be determined by binding arbitration instead of in courts of general jurisdiction. You agree that the U.S. Federal Arbitration Act governs the interpretation and enforcement of this provision, and that you and MediRate are each waiving the right to a trial by jury or to participate in a class action. This arbitration provision shall survive termination of the Subscription Agreement and these Terms and Conditions and any other contractual relationship between you and MediRate.
              </p>
              <p className="mb-4">
                7.4 Certain aspects of, or links contained in, the Product may link to websites or services operated by third parties unaffiliated with MediRate. Such links are provided for your convenience only. MediRate does not control such third-party websites and is not responsible for any content thereon, including with respect to any comments posted on such third-party websites. The inclusion of links to such third-party websites in the Product does not amount to or imply any endorsement or warranty of the material on such sites or any association with their owners or operators. You agree that MediRate is not responsible for any such third-party websites and services or any content thereon and agrees to indemnify and hold MediRate harmless from any and all claims or liability arising from your use of or reliance on such third-party websites or services. Any concerns or questions related to third-party websites should be directed to the webmaster or other appropriate contact person for such third party.
              </p>
              <p className="mb-4">
                7.5 MediRate is continuously developing and improving its products and services. MediRate may ask you or certain of your Authorized Users to provide feedback including, but not limited to, proposed names, survey responses, research study participation, or user experience insights (“Feedback”) about, among other things, its pre-commercial concepts, branding, and/or versions of new or existing products and services (collectively, “Beta Products”). MediRate is free to incorporate and implement any Feedback into MediRate products or services without payment of current or future royalties or compensation. In consideration of your participation in and access to Beta Product development, you hereby assign to MediRate all rights, title, and interest to Feedback, and, to the extent such assignment is not lawful, you hereby grant MediRate a perpetual, irrevocable, royalty-free, exclusive, transferrable, worldwide license to use Feedback for all purposes and with all products now known or later created. You acknowledge that Feedback not already publicly known when disclosed to MediRate becomes Confidential Information of MediRate. You consent to MediRate recording your Feedback. You relinquish any rights (including copyright) to the recording and understand the recording may be copied and used by MediRate without further permission by you. MediRate will not use your name, image or logo in any way endorsing any MediRate products or services without prior written consent from you.
              </p>
              <p className="mb-4">
                7.6 The failure of you, MediRate, or any third-party supplier of Materials to enforce any provision hereof shall not constitute or be construed as a waiver of such provision or of the right to enforce it later.
              </p>
              <p className="mb-4">
                7.7 You are liable for all costs of collection incurred by MediRate in connection with failure to pay for the Product, including, without limitation, collection agency fees, reasonable attorneys’ fees, and court costs.
              </p>
              <p className="mb-4">
                7.8 Neither you nor any Authorized User may assign your rights or delegate your duties under the Subscription Agreement or these Terms and Conditions without the prior written consent of MediRate, which consent shall not be unreasonably conditioned, delayed or withheld. The Subscription Agreement and any amendment thereto shall be binding on and will inure to the benefit of the parties and their respective successors and permitted assigns.
              </p>
              <p className="mb-4">
                7.9 The Subscription Agreement shall be governed by and construed in accordance with the laws of the State of New York regardless of the law that might otherwise apply under applicable principles of conflicts of law.
              </p>
              <p className="mb-4">
                7.10 The Subscription Agreement will be enforced to the fullest extent permitted by applicable law. If any provision of the Subscription Agreement is held to be invalid or unenforceable to any extent, then (a) such provision will be interpreted, construed, and reformed to the extent reasonably required to render it valid, enforceable and consistent with its original intent and (b) such invalidity or unenforceability will not affect any other provision of the Subscription Agreement.
              </p>
              <p className="mb-4">
                7.11 The Product is not, nor are they intended to be, legal, accounting, financial or other professional advice or a substitute for advice of an attorney, accountant or any other professional. The content of the Product is intended only as general information and is not intended to be and should not be relied upon as any professional advice. MediRate shall not be liable, and shall be held harmless, for any errors or omissions in the Product, and you assume all risks and liabilities in relying on the Product, contributing to a third party’s reliance on the Product, or inducing a third party to rely upon the Product. If you require expert assistance, you must obtain the services of a competent, professional person, and will not rely on or use the content provided on the Product as a substitute for such advice or assistance. No attorney-client relationship exists or shall be deemed to exist between you or any of your Authorized Users on the one hand, and MediRate on the other.
              </p>
              <p className="mb-4">
                7.12 The Subscription Agreement is a commercial agreement between the parties and shall not be deemed a consumer transaction except and solely to the extent expressly required by law.
              </p>
              <p className="mb-4">
                7.13 Where applicable, each affiliated company of MediRate and each third-party supplier of Materials has the right to assert and enforce the provisions of the Subscription Agreement directly on its own behalf as a third-party beneficiary.
              </p>
              <p className="mb-4">
                7.14 The Subscription Agreement constitutes the entire agreement of the parties with respect to its subject matter and replaces and supersedes any prior written or verbal communications, representations, proposals, or quotations on that subject matter.
              </p>
              <h3 className="font-semibold mt-4">Privacy Policy</h3>
              <div className="mb-4">
                <p>
                  <strong>1. About This Privacy Policy</strong><br />
                  This privacy policy supplements the Terms and Conditions and applies when you visit or use our websites, apps, and other services, including events, that refer or link to this privacy policy (collectively, the “Product”). This privacy policy may be supplemented by additional privacy statements, terms, or notices provided to you.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  MediRate LLC (“MediRate”) owns or administers the Product, as identified therein, and is the primary controller of your personal information provided to, or collected by or for, the Product.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  We will indicate within the registration processes of our products and services and other registration forms what types of personal information are required and those that are requested. You may choose not to submit the requested information, but that may limit or prohibit the services that MediRate is able to provide to you.
                </p>
              </div>

              <div className="mb-4">
                <p>
                  <strong>2. Information We Collect</strong><br />
                  We collect information about you in three ways: directly from your input, from third-party sources, and through automated technologies.
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Data You Provide To Us</li>
                  <li>Data From Your Organization</li>
                  <li>Data From Other Sources</li>
                </ul>
              </div>
              <div className="mb-4">
                <p>
                  <strong>2.1 Data You Provide To Us</strong><br />
                  The types of personal information that we collect directly from you depend on how you interact with us and the Product, which may include:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Contact details, such as your name, email address, postal address, social media handle, and phone number;</li>
                  <li>Account login credentials, such as usernames and passwords, password hints, and similar security information;</li>
                  <li>Other account registration and profile information, such as job title, educational and professional background and qualifications, and photo;</li>
                  <li>Payment information, such as a credit or debit card number;</li>
                  <li>Comments, feedback, and other information you provide to us, including search query data and questions or information you send to customer support; and/or</li>
                  <li>Interests and communication preferences, including preferred language.</li>
                </ul>
              </div>
              <div className="mb-4">
                <p>
                  <strong>2.2 Data From Your Organization</strong><br />
                  We may obtain personal information about you from the organization with which you are employed or affiliated in order to activate and manage your access to and use of the organization’s subscription to the Product, including:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Contact details, such as your name and organizational email address, postal address, and phone number;</li>
                  <li>Other account registration information such as job title; and/or</li>
                  <li>Organizational user ID.</li>
                </ul>
              </div>
              <div className="mb-4">
                <p>
                  <strong>2.3 Data From Other Sources</strong><br />
                  We also may obtain contact details and other information about you from our affiliates and from other third parties, including:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Social networks when you grant permission to the Product to access your data on one or more networks;</li>
                  <li>Service providers that help us determine a location in order to customize certain products to your location;</li>
                  <li>Businesses with which we offer co-branded services or engage in joint marketing activities; and/or</li>
                  <li>Publicly available sources and data suppliers from which we obtain data to validate or supplement the information we hold.</li>
                </ul>
              </div>
              <div className="mb-4">
                <p>
                  <strong>2.4 Data From Product Use, Including Cookies and Similar Technologies</strong><br />
                  The Product may automatically collect information about how you and your device interact with the Product, including:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Computer, device, and connection information, such as IP address, browser type and version, operating system, and other software installed on your device, mobile platform, and unique device identifier and other technical identifiers, error reports, and performance data; and</li>
                  <li>Usage data, such as the features you used, the settings you selected, your URL click stream data, including date and time stamp and referring and exit pages, search terms you used, and pages you visited or searched for on the Product.</li>
                </ul>
              </div>

              <div className="mb-4">
                <p>
                  <strong>3. How We Use Your Information</strong><br />
                  Depending on how you interact with us and the Product, we may use your personal information to:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Provide, activate, and manage your access to and use of the Product;</li>
                  <li>Process and fulfill a request, order, download, subscription, or other transaction;</li>
                  <li>Provide technical, product, and other support and to help keep the Product working, safe, and secure;</li>
                  <li>Enhance and improve the Product and our other products, events, and services and to develop new products, services, and benefits;</li>
                  <li>Offer you customized content and other personalization to make the Product more relevant to your interests and geography;</li>
                  <li>Respond to your requests, inquiries, comments, and concerns;</li>
                  <li>Notify you about changes, updates, and other announcements related to the Product and our other products and services;</li>
                  <li>Deliver targeted advertisements, promotional messages, notices, and other information related to the Product and your interests;</li>
                  <li>Provide you with promotional messages and other information about products, events, and services of ours, our affiliates, and third parties such as sponsors;</li>
                  <li>Invite you to participate in user testing and surveys as well as drawings, sweepstakes, competitions, and similar promotions;</li>
                  <li>Identify usage trends and develop data analysis, including for purposes of research, audit, reporting, and other business operations, including determining the effectiveness of our promotional campaigns and evaluating our business performance, or in other ways pursuant to a customer agreement; and/or</li>
                  <li>Comply with our legal obligations, resolve disputes, and enforce our agreements.</li>
                </ul>
              </div>
              <div className="mb-4">
                <p>
                  If you are an administrator of an organization with a subscription to the Product, we will use your details to communicate with you about your organization’s subscription and related services. If you supply us contact information of your colleagues, we may contact those individuals with communications about the Product that may include reference to you.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  <strong>4. Sharing Of Your Information</strong><br />
                  <strong>4.1 Your Organization</strong><br />
                  If you access the Product through a subscription administered by your organization, your personal information and certain usage data gathered through the Product may be accessed by or shared with the administrators authorized by your organization for the purposes of usage analysis, subscription management and compliance, training course progress, performance and remediation, cost attribution and departmental budgeting.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  <strong>4.2 Application Licensor</strong><br />
                  If you access a third-party application on the Product through a license agreement with the licensor of that application, personal information relevant to that third-party application may be shared with the licensor so that it can provide you access to the application, subject to the terms of its license agreement and privacy policy.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  <strong>4.3 Our Group Companies and Service Providers</strong><br />
                  Dependent upon the Product provided, we share information with:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Our affiliates, trading names and divisions within MediRate that provide technology, customer service and other shared services functions; and/or</li>
                  <li>Our service providers, suppliers, agents and representatives, including but not limited to, payment processors, customer support, email service providers, event venues and service providers, IT service providers, marketing service providers, research providers, mailing houses and shipping agents;</li>
                </ul>
                to process the information as necessary to provide the Product, complete a transaction or fulfill your request or otherwise on our behalf based on our instructions and in compliance with this privacy policy and any other appropriate confidentiality and security measures.
              </div>
              <div className="mb-4">
                <p>
                  <strong>4.4 Your Choices</strong><br />
                  We may share your personal information with our affiliates and with sponsors, joint venture entities and other third parties, including entities for which we are acting as an agent, licensee, application host or publisher, that wish to send you information about their products and services that may be of interest to you, as determined by your choices in managing your communications preferences and other settings.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  <strong>4.5 For Legal Reasons</strong><br />
                  We also will disclose your personal information if we have a good faith belief that such disclosure is necessary to:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Meet any applicable law, regulation, legal process or other legal obligation;</li>
                  <li>Detect, investigate and help prevent security, fraud or technical issues; and/or</li>
                  <li>Protect the rights, property or safety of MediRate, our users, employees or others; and</li>
                  <li>As part of a corporate transaction, such as a transfer of assets to or an acquisition by or merger with another company.</li>
                </ul>
              </div>

              <div className="mb-4">
                <p>
                  <strong>5. Grounds For Processing</strong><br />
                  When we collect or otherwise process any personal information within the scope of applicable data protection laws, we do so:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Where necessary to provide the Product, fulfill a transaction or otherwise perform a contract with you or at your request prior to entering into a contract;</li>
                  <li>Where necessary for our compliance with applicable law or other legal obligation;</li>
                  <li>Where necessary for the performance of a task carried out in the public interest;</li>
                  <li>Where necessary to enable our customers to comply with their legal obligations;</li>
                  <li>Where applicable, with your consent; and/or</li>
                  <li>Where necessary to operate our business, protect the security of our systems, customers and users, detect or prevent fraud, or fulfill our other legitimate interests as described in sections 2-4 above, except where our interests are overridden by your privacy rights.</li>
                </ul>
              </div>
              <div className="mb-4">
                <p>
                  Where we rely on your consent to process personal information, you have the right to withdraw your consent at any time, and where we rely on legitimate interests, you may have the right to object to our processing.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  <strong>9. Children’s Privacy</strong><br />
                  We do not knowingly collect information from children under the age of 13 or target the Product to children under 13.
                </p>
              </div>

              <div className="mb-4">
                <p>
                  <strong>10. Your Communications Preferences</strong><br />
                  You can customize and manage your communications preferences and other settings when you register with the Product, by updating your account features and preferences, by using the “opt-out” mechanisms such as “unsubscribe” or other means provided within the communications that you receive, or by contacting us. We reserve the right to notify you of changes or updates to the Product whenever necessary.
                </p>
              </div>

              <div className="mb-4">
                <p>
                  <strong>11. Accessing and Updating Your Information</strong><br />
                  <strong>11.1 Your Account</strong><br />
                  The Product may allow registered users to directly access and review their account information and make corrections or updates upon login at any time. Keeping such information up to date is the responsibility of the user. Registered users may also close their account directly through the Product or by contacting the Product’s customer support.
                </p>
              </div>
              <div className="mb-4">
                <p>
                  <strong>11.2 Your Rights</strong><br />
                  You may have the right under applicable privacy and data protection laws to request free of charge:
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>Access to your personal information;</li>
                  <li>Rectification or erasure of your personal information;</li>
                  <li>Restriction of our processing of your personal information, or to object to our processing; and</li>
                  <li>Portability of your personal information.</li>
                </ul>
                If you wish to exercise these rights, please submit your request in writing to us at contact@medirate.net. We will respond to your request consistent with applicable laws. To protect your privacy and security, we may require you to verify your identity.
              </div>
              <div className="mb-4">
                <p>
                  <strong>12. Changes</strong><br />
                  We will update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date. If we make any material changes, we will provide notice through the Product or by other means.
                </p>
              </div>

              <div className="mb-4">
                <p>
                  <strong>13. Contact</strong><br />
                  If you have any questions, comments, complaints, or requests regarding this privacy policy or our processing of your information, please contact us at contact@medirate.net.
                </p>
              </div>

              <div className="mb-4">
                <p>
                  You may also lodge a complaint to a data protection authority in the applicable jurisdiction.
                </p>
              </div>

              <div className="mb-4">
                <p>
                  <strong>Last updated:</strong> [Insert Date]
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleAccept}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Accept Terms
              </button>
            </div>
          </div>
    </PortalModal>
  );
} 