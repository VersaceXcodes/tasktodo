import React from "react";
import { useNavigate } from "react-router-dom";

const GV_Footer: React.FC = () => {
  const current_year = new Date().getFullYear();
  const navigate = useNavigate();

  const handleLegalLinkClick = () => {
    navigate("/legal");
  };

  const handleContactLinkClick = () => {
    navigate("/contact");
  };

  return (
    <>
      <footer className="bg-gray-100 border-t border-gray-300 text-gray-600">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm">
            © {current_year} My App. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <button
              type="button"
              onClick={handleLegalLinkClick}
              className="text-sm hover:underline focus:outline-none"
              aria-label="Privacy Policy"
              role="link"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={handleLegalLinkClick}
              className="text-sm hover:underline focus:outline-none"
              aria-label="Terms of Service"
              role="link"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={handleContactLinkClick}
              className="text-sm hover:underline focus:outline-none"
              aria-label="Contact Us"
              role="link"
            >
              Contact Us
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;