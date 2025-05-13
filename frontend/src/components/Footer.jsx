function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
        <p>© {new Date().getFullYear()} ImageGenHub - Community Meme Generator & Voting</p>
        <div className="mt-2 flex justify-center space-x-4">
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
