'use client';

import { useState } from 'react';
import Footer from '@/app/components/footer'; // Assuming you have a Footer component

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear specific field error
    setStatus(''); // Clear overall status
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required.';
    if (!formData.lastName) newErrors.lastName = 'Last name is required.';
    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }
    if (!formData.message) newErrors.message = 'Message is required.';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('Email sent successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          company: '',
          title: '',
          email: '',
          message: '',
        });
      } else {
        setStatus(`Error: ${data.error || 'Failed to send email'}`);
      }
    } catch (error) {
      setStatus('Error: Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Reusable Gradient Background */}
      <div className="absolute inset-0 -z-10 reusable-gradient-bg"></div>

      {/* Main Content */}
      <main className="relative flex-grow py-12 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Heading and Text */}
          <div>
            <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
              Contact Us
            </h1>
            <p className="text-gray-700 leading-relaxed mb-6">
              Submit your questions and/or feedback. A customer service representative will follow up with you shortly.
            </p>
            <p className="text-gray-700 leading-relaxed">
              MediRate strives to serve a broad array of Medicaid stakeholders. If there's any information you'd like to see us add to our database,
              including service lines that are not currently captured, please share it with us.
            </p>
          </div>

          {/* Right Side: Contact Form */}
          <div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className={`w-full p-3 border ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 ${
                      errors.firstName ? 'focus:ring-red-500' : 'focus:ring-[#012C61]'
                    }`}
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className={`w-full p-3 border ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 ${
                      errors.lastName ? 'focus:ring-red-500' : 'focus:ring-[#012C61]'
                    }`}
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="company"
                    placeholder="Company"
                    className={`w-full p-3 border ${
                      errors.company ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 ${
                      errors.company ? 'focus:ring-red-500' : 'focus:ring-[#012C61]'
                    }`}
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                  {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    className={`w-full p-3 border ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 ${
                      errors.title ? 'focus:ring-red-500' : 'focus:ring-[#012C61]'
                    }`}
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className={`w-full p-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 ${
                    errors.email ? 'focus:ring-red-500' : 'focus:ring-[#012C61]'
                  }`}
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <textarea
                  rows={5}
                  name="message"
                  placeholder="Message"
                  className={`w-full p-3 border ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 ${
                    errors.message ? 'focus:ring-red-500' : 'focus:ring-[#012C61]'
                  }`}
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 text-white font-semibold rounded-md ${
                  loading ? 'bg-gray-400' : 'bg-[#012C61] hover:bg-[#011B40]'
                }`}
              >
                {loading ? 'Sending...' : 'Submit'}
              </button>
            </form>
            {status && (
              <div
                className={`mt-4 text-center p-3 rounded ${
                  status.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {status}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default ContactUs;
