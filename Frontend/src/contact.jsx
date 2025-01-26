import React, { useState } from 'react';
import { Mail, User, Phone } from 'lucide-react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">Contact Information</h2>
        <p className="text-gray-600 text-center mb-4">Please enter your contact details</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <div className="flex">
              <div className="flex items-center bg-white border border-r-0 rounded-l px-2 text-gray-500">
                <img
                  src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3e%3cpath fill='%23FF9933' d='M0 24h36v4H0z'/%3e%3cpath fill='%23FFF' d='M0 16h36v8H0z'/%3e%3cpath fill='%23138808' d='M0 8h36v8H0z'/%3e%3c/svg%3e"
                  alt="Indian flag"
                  className="w-5 h-5"
                />
                <span className="ml-1">+91</span>
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="Mobile Number"
                className="w-full py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
