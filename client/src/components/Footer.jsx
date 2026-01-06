import logo from '../assets/logo.png';
import { FaGithub } from "react-icons/fa";

const Footer = () => (
  <div className="w-full flex md:justify-center justify-between items-center flex-col p-4 gradient-bg-footer">
    

    <div className="sm:w-[90%] w-full h-[0.25px] bg-gray-400 mt-5 " /> 

    <div className="sm:w-[90%] w-full flex justify-between items-center mt-3">
      
      <a
        href="https://github.com/anuow/web3-blockchain-anu"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-gray-400 transition"
      >
        <FaGithub size={28} />
      </a>
      <p className="text-white text-sm text-center">Built with care. Powered by decentralized technology.</p>
      <p className="text-white text-right text-xs">All rights reserved</p>
    </div>
  </div>
);
export default Footer;