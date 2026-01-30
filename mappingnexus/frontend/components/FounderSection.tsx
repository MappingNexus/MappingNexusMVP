import React from 'react';
import { Linkedin, Mail, MapPin } from 'lucide-react';

export const FounderSection: React.FC = () => {
  return (
    <section className="w-full bg-gradient-to-b from-zinc-900 via-black to-zinc-950 py-16 sm:py-24 border-y border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-white mb-3 tracking-wide">
            Founder & Vision
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-zinc-600 to-zinc-500 mx-auto"></div>
        </div>

        {/* Founder Card */}
        <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-900/60 border border-zinc-700/50 rounded-lg overflow-hidden hover:border-zinc-600/80 transition-all duration-300 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Photo Section */}
            <div className="flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 p-8 sm:p-12 md:col-span-1">
              <div className="relative">
                {/* LinkedIn Photo - replace with actual image */}
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center overflow-hidden">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=DhairyaTiwari&backgroundColor=1e40af"
                    alt="Dhairya Kumar Tiwari"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* LinkedIn Badge */}
                <a
                  href="https://www.linkedin.com/in/dhairya-kumar-tiwari-591b16349/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-full hover:bg-blue-500 transition-colors shadow-lg"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Content Section */}
            <div className="md:col-span-2 p-8 sm:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="text-2xl sm:text-3xl font-light text-white mb-1 tracking-tight">
                  Dhairya Kumar Tiwari
                </h3>
                <p className="text-blue-400 font-mono text-xs sm:text-sm uppercase tracking-widest mb-4">
                  Founder & CEO
                </p>
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>India</span>
                </div>
              </div>

              {/* About */}
              <div className="mb-8">
                <h4 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
                  Mission
                </h4>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
                  Building enterprise solutions for data mapping and employee management at scale. 
                  Transforming how organizations organize, manage, and optimize their workforce intelligence 
                  through innovative technology and seamless integration.
                </p>
              </div>

              {/* Expertise */}
              <div className="mb-8">
                <h4 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
                  Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Full Stack Development', 'Enterprise Solutions', 'Data Management', 'Product Strategy', 'Team Building'].map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 text-xs font-mono text-zinc-400 border border-zinc-700/50 rounded-full hover:border-zinc-600 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Links */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://www.linkedin.com/in/dhairya-kumar-tiwari-591b16349/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-sm font-mono uppercase tracking-widest transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  Connect on LinkedIn
                </a>
                <a
                  href="mailto:tiwari.dhairya@zohomail.in"
                  className="flex items-center justify-center gap-2 border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white px-6 py-3 rounded text-sm font-mono uppercase tracking-widest transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              number: '250+',
              label: 'Employees',
              description: 'Managed across enterprises'
            },
            {
              number: '5000+',
              label: 'Companies',
              description: 'Potential market reach'
            },
            {
              number: '24/7',
              label: 'Support',
              description: 'Enterprise-grade service'
            }
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-6 border border-zinc-700/50 rounded-lg bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
              <div className="text-2xl sm:text-3xl font-light text-white mb-2">
                {stat.number}
              </div>
              <h5 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-1">
                {stat.label}
              </h5>
              <p className="text-zinc-500 text-sm font-light">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
