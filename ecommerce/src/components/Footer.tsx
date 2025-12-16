const Footer = () => {
  return (
    <footer className="bg-[#f0f0f0] text-black mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_repeat(4,1fr)] gap-10 md:gap-8 lg:gap-12">
          {/* Brand + social */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight">SHOP.CO</h3>
              <p className="text-sm text-black/70 leading-relaxed max-w-xs">
                We have clothes that suits your style and which you&apos;re proud to wear. From women to men.
              </p>
            </div>
            <div className="flex items-center gap-3 text-black">
              {['twitter', 'facebook', 'instagram', 'linkedin'].map((network) => (
                <a
                  key={network}
                  href="#"
                  aria-label={network}
                  className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                >
                  {network === 'twitter' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.48v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                    </svg>
                  )}
                  {network === 'facebook' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  )}
                  {network === 'instagram' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  )}
                  {network === 'linkedin' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
                      <path d="M100.28 448H7.4V148.9h92.88zm-46.44-340a53.69 53.69 0 1153.69-53.69 53.69 53.69 0 01-53.69 53.69zM447.9 448h-92.6V302.4c0-34.7-.7-79.2-48.24-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.7V148.9h89v40.8h1.3c12.4-23.5 42.7-48.2 87.88-48.2 94 0 111.3 61.9 111.3 142.3V448z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: 'Company',
              links: ['About', 'Features', 'Works', 'Career'],
            },
            {
              title: 'Help',
              links: ['Customer Support', 'Delivery Details', 'Terms & Conditions', 'Privacy Policy'],
            },
            {
              title: 'FAQ',
              links: ['Account', 'Manage Deliveries', 'Orders', 'Payments'],
            },
            {
              title: 'Resources',
              links: ['Free eBooks', 'Development Tutorial', 'How to - Blog', 'Youtube Playlist'],
            },
          ].map((section) => (
            <div key={section.title} className="space-y-5">
              <h4 className="text-sm font-semibold tracking-[0.3em] uppercase">{section.title}</h4>
              <div className="flex flex-col gap-3 text-sm text-black/70">
                {section.links.map((link) => (
                  <a key={link} href="#" className="hover:text-black transition-colors">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-black/10 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm text-black/60">Shop.co © 2000-2023, All Rights Reserved</p>
          <div className="flex gap-3">
            {['VISA', 'MC', 'PP', 'GP', 'AP'].map((label) => (
              <div key={label} className="w-[46px] h-[30px] bg-white rounded border border-black/10 shadow-sm flex items-center justify-center">
                <span className="text-[11px] font-semibold text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

