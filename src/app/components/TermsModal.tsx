"use client";

import { useState, useEffect } from 'react';
import Modal from './modal';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

export default function TermsModal() {
  const { isAuthenticated, isLoading } = useKindeBrowserClient();
  const [isOpen, setIsOpen] = useState(false);

  // Show the modal once per session when the user logs in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const accepted = sessionStorage.getItem('termsAccepted');
      if (!accepted) {
        setIsOpen(true);
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleAccept = () => {
    sessionStorage.setItem('termsAccepted', 'true');
    setIsOpen(false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      width="max-w-4xl"
      className="z-[1002]"
      showCloseButton={false}
    >
      <div className="p-6 flex flex-col h-[80vh]">
        <h2 className="text-xl font-bold text-[#012C61] uppercase font-lemonMilkRegular text-center mb-4">
          Notifications and Terms of Use
        </h2>
        
        <div className="flex-1 overflow-y-auto pr-4 text-sm text-gray-700">
          <p className="mb-4">
            MediRate's Product includes data that is collected from fee schedules established and made publicly available by state governmental agencies including those responsible for individuals enrolled in Medicaid. MediRate endeavors to update data based on the most recently available information, but given the complexity of Medicaid rate setting policies, it is possible that errors exist. We do not guarantee accuracy of the data, as reflected in MediRate's Terms.
          </p>
          
          <p className="mb-4">
            In addition, the following terms apply to your use of the data in the Product:
          </p>

          <ul className="list-disc list-inside space-y-3 mb-4">
            <li>The fee schedules do not address the various coverage limitations routinely applied by state agencies before final payment is determined (e.g., beneficiary and provider eligibility, benefit limits, billing instructions, frequency of services, third party liability, age restrictions, prior authorization, co-payments/coinsurance where applicable).</li>
            <li>Procedure codes and/or fee schedule amounts listed do not guarantee payment, coverage or amount allowed.</li>
            <li>Although every effort is made to ensure the accuracy of this information, discrepancies may occur. MediRate's data may be changed or updated at any time to correct such discrepancies.</li>
            <li>Payment rate information reflects amounts paid to providers under fee for service arrangements with state agencies. Payment rates between providers and managed care organization are privately negotiated and are not presented here, except in certain circumstances. MediRate's data should not be relied upon as the basis for reimbursement in circumstances where managed care organizations are responsible for payment.</li>
            <li>In general, state policies dictate that provider reimbursement is based on the lesser of the amount billed or the Medicaid maximum amount which is listed in the fee schedule.</li>
            <li>MediRate data is limited to certain services lines and procedure codes. While MediRate is actively adding new service lines to its database, MediRate's database may not include the the service lines you are looking for. For a list of service lines currently included in MediRate's database and those in development see <a href="https://www.MediRate.net" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">www.MediRate.net</a> or contact us at contact@MediRate.net.</li>
            <li>MediRate's database is organized by Current Procedural Terminology (CPT), and Healthcare Common Procedure Coding System (HCPCS) billing codes. Use of CPT codes, descriptors, and other data are subject to the copyright terms of the American Medical Association.</li>
          </ul>

          <p className="font-semibold mb-4">
            USE OF THE MEDIRATE PRODUCT IS SUBJECT TO THE FOLLOWING TERMS AND CONDITIONS
          </p>

          <ol className="list-decimal list-inside space-y-3">
            <li>CPT® Content is copyrighted by the American Medical Association and CPT is a registered trademark of the AMA.</li>
            <li>MediRate, as a party to a license agreement with the AMA, is authorized to grant End User a limited, non-exclusive, non-transferable, non-sublicensable license for End User to use CPT Content in MediRate's Licensed Product(s), for the sole purpose of internal use by End User within the Territory. Upon termination or expiration of the Agreement between MediRate and AMA, MediRate shall notify End User. End User shall continue to have the right to use CPT Content in MediRate's Licensed Product(s) for the remainder of year of the then-current annual release (e.g., through the end of the applicable calendar year)(“End User Tail Period”). End User's continued use of CPT Content during the End User Tail Period is subject to End User's continued compliance with all its obligations under these terms. Upon the expiration of the End User Tail Period, the sublicense granted under these terms shall automatically terminate.</li>
            <li>The provision of updated CPT Content in the MediRate Product(s) is dependent on a continuing contractual relationship between MediRate and the AMA.</li>
            <li>End User is prohibited from making CPT Content publicly available; creating derivative works (including translating) of the CPT Content; and transferring, selling, leasing, licensing, or otherwise making available the CPT Content, or a copy or portion of CPT Content, to any unauthorized party, including a subsidiary, affiliate, or other legal entity, however designated, for any purpose whatsoever except as expressly permitted in this Agreement.</li>
            <li>End User expressly acknowledges and agrees to the extent permitted by applicable law, use of the CPT Content is at End User's sole risk and the CPT Content is provided “as is” without warranty of any kind. The AMA does not directly or indirectly practice medicine or dispense medical services. Fee schedules, relative value units, conversion factors and/or related components are not assigned by the AMA, are not part of CPT, and the AMA is not recommending their use. The CPT Content does not replace the AMA's Current Procedural Terminology book or other appropriate coding authority. The coding information contained in the CPT Content should be used only as a guide.</li>
            <li>End User is required to keep records and submit reports including information necessary for the calculation of royalties payable to the AMA by MediRate, of the same type as required of MediRate under this Agreement. End User consents to the release of such information to the AMA. End User further agrees to provide, without delay, additional information that the AMA (as a third-party beneficiary) may reasonably request, to verify the information. Nothing herein shall require End User to submit or release information that would cause End User to be in violation of applicable federal or state privacy laws.</li>
            <li>U.S. Government End Users. CPT is commercial technical data, which was developed exclusively at private expense by the American Medical Association (AMA), 330 North Wabash Avenue, Chicago, Illinois 60611. This agreement does not grant the Federal Government a direct license to use CPT based on FAR 52.227-14 (Data Rights – General) and DFARS 252.227-7015 (Technical Data – Commercial Items).</li>
            <li>End User must ensure that anyone with authorized access to the MediRate Product(s) will comply with the provisions of the End User Agreement.</li>
            <li>AMA shall be named as a third-party beneficiary of the End User Agreement.</li>
            <li>End User expressly consents to the release of its name to the AMA.</li>
            <li>The responsibility for the content of any “National Correct Coding Policy” included in this product is with the Centers for Medicare and Medicaid Services and no endorsement by the AMA is intended or should be implied. The AMA disclaims responsibility for any consequences or liability attributable to or related to any use, nonuse or interpretation of information contained in this product.</li>
          </ol>
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
    </Modal>
  );
} 