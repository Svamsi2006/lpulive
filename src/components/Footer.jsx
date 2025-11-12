import './Footer.css'

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-branding">
          <span className="footer-logo">LPU Live</span>
          <span className="footer-tagline">Connecting LPU Students</span>
        </div>
        
        <div className="footer-divider"></div>
        
        <div className="footer-developers">
          <div className="developer-label">Developed with ❤️ by</div>
          <div className="developers-list">
            <a 
              href="https://www.linkedin.com/in/vamsi-/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="developer-card"
            >
              <div className="developer-icon">💻</div>
              <div className="developer-info">
                <div className="developer-name">Vamsi Siva Ganesh</div>
                <div className="developer-role">Co-Developer</div>
              </div>
              <div className="linkedin-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
            </a>
            
            <a 
              href="https://www.linkedin.com/in/gunda-venkatasai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="developer-card"
            >
              <div className="developer-icon">🚀</div>
              <div className="developer-info">
                <div className="developer-name">Gunda Venkatasai</div>
                <div className="developer-role">Lead Developer</div>
              </div>
              <div className="linkedin-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
            </a>
          </div>
        </div>
        
        <div className="footer-copyright">
          <span>© 2025 LPU Live. All rights reserved.</span>
          <span className="footer-dot">•</span>
          <span>Made for LPU Students</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
