import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin } from "lucide-react";
import Footer from "@/app/components/footer"; // Import the Footer component

export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#e0e6ed] to-[#dbeafe]">
      <main className="flex-1">
        <section className="flex justify-center">
          <div className="w-full max-w-4xl bg-white/95 rounded-2xl shadow-xl p-10 md:p-16 mt-12 mb-12">
            <h1 className="text-3xl md:text-4xl text-[#002F6C] font-lemonMilkRegular uppercase tracking-wide mb-4 text-center">About Us</h1>
            <div className="flex justify-center mb-10">
              <span className="block w-24 h-1 rounded-full bg-gradient-to-r from-[#012C61] to-[#3b82f6]" />
            </div>
            <p className="text-gray-700 leading-relaxed text-lg mb-8 text-center">
            Our team has deep experience and expertise in Medicaid policy setting, program administration, provider operations, and due diligence analysis. MediRate and its advisors bring unique expertise in the areas of:
          </p>
            <ul className="list-disc list-inside text-gray-700 text-left space-y-4 mb-8 md:mb-12">
            <li>Long-term services and supports, including home and community-based services</li>
            <li>Home health and private duty nursing</li>
            <li>Behavioral Health services</li>
            <li>Services for individuals living with addiction</li>
            <li>Services for individuals living with autism</li>
          </ul>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="relative py-16 px-8 text-left">
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-lemonMilkRegular text-[#002F6C] uppercase tracking-wide mb-16 text-center">
            Meet Our Team
          </h2>
          
          {/* Founder */}
            <h3 className="text-xl font-lemonMilkRegular text-[#002F6C] uppercase tracking-wide mb-12 text-center">Founder</h3>
          <div className="flex flex-col md:flex-row items-center md:space-x-12 mb-16 bg-gray-100 p-8 rounded-lg">
            <div className="flex-shrink-0">
              <Image
                src="/images/Greg Headshot.jpeg"
                alt="Greg Nersessian"
                width={350}
                height={650}
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="text-lg text-left flex-grow">
              <h3 className="text-2xl font-semibold text-[#002F6C] mb-6">Greg Nersessian</h3>
              <p className="text-gray-700 leading-relaxed mb-8">
                Greg Nersessian is President and Founder of MediRate, LLC. Prior to founding MediRate, Greg spent 14 years as a healthcare consultant for Health Management Associates (HMA), the nation's largest consulting firm focused on government-sponsored healthcare programs.
              </p>
              <p className="text-gray-700 leading-relaxed mb-8">
                Greg's work at HMA involved supporting healthcare providers, investors, and other stakeholders in their evaluation of capital allocation opportunities within government-funded businesses. In this role, Greg recognized the key role that reimbursement rate dynamics play in private sector partnerships. Greg founded MediRate with the goal of improving cost transparency and data comparability across programs.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Prior to joining HMA, Greg spent a decade on Wall Street as an equity research analyst.
              </p>
            </div>
          </div>
          
          {/* Advisors */}
            <h3 className="text-xl font-lemonMilkRegular text-[#002F6C] uppercase tracking-wide mb-12 text-center">Advisors</h3>
          <div className="flex flex-col md:flex-row items-center md:space-x-12 mb-16 bg-gray-100 p-8 rounded-lg">
            <div className="flex-shrink-0">
              <Image
                src="/images/Kevin Hancock.png"
                alt="Kevin Hancock"
                width={350}
                height={650}
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="text-lg text-left flex-grow">
              <h4 className="text-xl font-semibold text-[#002F6C] mb-4">Kevin Hancock</h4>
              <p className="text-gray-700 leading-relaxed mb-8">
                Kevin Hancock has three decades of expertise in Medicaid, Long-term Services and Supports, Managed Care, strategic planning, and program evaluation. With a long background in Pennsylvania state government,
                Kevin held roles such as Special Advisor to the Secretary for the Pennsylvania Department of Aging. In this capacity, he spearheaded the development of Aging Our Way, PA, the state's comprehensive 10-year strategic plan aimed at enhancing the health, well-being, and quality of life of its sizable older adult population.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Kevin's extensive government service also includes serving as Deputy Secretary for the Department of Human Services Office of Long-term Living, where he led the implementation of Pennsylvania's Community HealthChoices Program, a Medicaid-funded managed long-term services and supports initiative valued at over $15 billion.
              </p>
            </div>
          </div>

            {/* Carl Mercurio Advisor Card */}
            <div className="flex flex-col md:flex-row items-center md:space-x-12 mb-16 bg-gray-100 p-8 rounded-lg">
              <div className="flex-shrink-0">
                <Image
                  src="/images/Carl Headshot.jpg"
                  alt="Carl Mercurio"
                  width={350}
                  height={650}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="text-lg text-left flex-grow">
                <h4 className="text-xl font-semibold text-[#002F6C] mb-4">Carl Mercurio</h4>
                <p className="text-gray-700 leading-relaxed mb-8">
                  Carl Mercurio serves as an advisor to MediRate. Carl is a business information publishing executive with nearly 40 years of experience. Most recently, he served for nearly a decade as founding publisher and managing director of HMA Information Services (HMAIS). HMAIS is a leading, online subscription news and information service covering Medicaid.
                </p>
                <p className="text-gray-700 leading-relaxed mb-8">
                  Prior to joining HMAIS, Carl spent 17 years as president of Corporate Research Group, a leading publisher of newsletters, research reports, and conferences on the healthcare industry. Carl also spent a decade as a managing editor and editorial director of Simba Information and its predecessor Corporate Research Group, which covers the media industry.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Over the course of his career, Carl has launched dozens of newsletters, research reports, and conferences serving thousands of users.
                </p>
              </div>
            </div>

          {/* Tim McDonald Advisor Card */}
          <div className="flex flex-col md:flex-row items-center md:space-x-12 mb-16 bg-gray-100 p-8 rounded-lg">
            <div className="flex-shrink-0">
              <Image
                src="/images/Mcdonald.jpg"
                alt="Tim McDonald"
                width={350}
                height={650}
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="text-lg text-left flex-grow">
              <h4 className="text-xl font-semibold text-[#002F6C] mb-4">Tim McDonald</h4>
              <p className="text-gray-700 leading-relaxed mb-8">
                Tim McDonald has led marketing strategy for a number of high-growth, health care services companies. From 2009 to 2013, Tim spearheaded strategic initiatives that strengthened Amerigroup's core Medicaid business prior to the Company's sale to Anthem. He co-led a senior team that made strategic choices on entering new states, enrolling new populations and expanding the company's scope of services.
              </p>
              <p className="text-gray-700 leading-relaxed mb-8">
                Other health care services where he led marketing strategy and played a senior business development role include UnitedHealthcare, MetraHealth, Value Health, and two private equity backed companies that were later acquired. In addition to his corporate roles, he's been an independent investor and advisor to high-growth health care and IT services organizations.
              </p>
              <p className="text-gray-700 leading-relaxed">
                A graduate of Princeton University and The Wharton Business School, Tim is on the Executive Advisory Board of the University of Pennsylvania's Leonard Davis Institute of Health Economics.
              </p>
            </div>
          </div>

          {/* Other Advisors */}
          <div className="flex justify-between md:justify-around gap-12">
            
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
