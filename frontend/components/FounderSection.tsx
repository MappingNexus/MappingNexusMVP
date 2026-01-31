import React, { useState } from 'react';
import { Linkedin, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  location: string;
  image: string;
  linkedin: string;
  email: string;
  bioHeader: string;
  bio: string;
  expertise: string[];
}

const teamMembers: TeamMember[] = [
  {
    name: 'Dhairya Kumar Tiwari',
    role: 'Founder & CEO',
    location: 'India',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Dhairya&lips=variant01&beardProbability=100',
    linkedin: 'https://www.linkedin.com/in/dhairya-kumar-tiwari-591b16349/',
    email: 'tiwari.dhairya@zohomail.in',
    bioHeader: 'Mission',
    bio: 'Building enterprise solutions for data mapping and employee management at scale. Transforming how organizations organize, manage, and optimize their workforce intelligence through innovative technology and seamless integration.',
    expertise: ['Full Stack Development', 'Enterprise Solutions', 'Data Management', 'Product Strategy', 'Team Building']
  },
  {
    name: 'Manya Shukla',
    role: 'Co-Founder and Managing Director',
    location: 'India',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sharvesh&lips=variant01&longHairProbability=100&beardProbability=0',
    linkedin: 'https://www.linkedin.com/in/manya-shukla-673a69289/',
    email: 'manya.shukla@mappingnexus.com',
    bioHeader: 'Operational Excellence',
    bio: 'Driving the strategic vision and operational efficiency of the company. overseeing global business operations, fostering key partnerships, and ensuring sustainable growth across all market verticals.',
    expertise: ['Business Strategy', 'Operations Management', 'Global Partnerships', 'Corporate Governance', 'Leadership']
  },
  {
    name: 'Kshitij Tiwari',
    role: 'Founding Partner and Business Lead',
    location: 'India',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Kshitij&lips=variant01&beardProbability=100&glassesProbability=100',
    linkedin: '#',
    email: 'kshitij.tiwari@mappingnexus.com',
    bioHeader: 'Business Growth',
    bio: 'Spearheading business development and market expansion strategies. deep expertise in identifying new opportunities, building client relationships, and driving revenue growth through strategic sales initiatives.',
    expertise: ['Business Development', 'Sales Strategy', 'Market Analysis', 'Client Relations', 'Revenue Growth']
  },
  {
    name: 'Sharvesh',
    role: 'Founding Engineer and Technical Lead',
    location: 'India',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Manya&lips=variant01&beardProbability=100',
    linkedin: 'https://www.linkedin.com/in/sharvesh-s-ramchandani-5039641b2/',
    email: 'sharvesh@mappingnexus.com',
    bioHeader: 'Engineering Mastery',
    bio: 'Leading the engineering team to build robust and scalable technical solutions. responsible for the core architecture, code quality, and implementing cutting-edge technologies to solve complex engineering challenges.',
    expertise: ['Software Engineering', 'System Architecture', 'Full Stack Development', 'Team Leadership', 'Technical Strategy']
  }
];

export const FounderSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextMember = () => {
    setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
  };

  const prevMember = () => {
    setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  const member = teamMembers[currentIndex];

  return (
    <section className="w-full bg-gradient-to-b from-zinc-900 via-black to-zinc-950 py-16 sm:py-24 border-y border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Style for animations */}
        <style>{`
          @keyframes carouselSlideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .carousel-animate {
            animation: carouselSlideIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
        `}</style>

        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-white mb-3 tracking-wide">
            Meet The Team
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-zinc-600 to-zinc-500 mx-auto"></div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons - Absolute positioned on desktop, maybe different on mobile */}
          <button
            onClick={prevMember}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 z-10 p-2 sm:p-3 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all focus:outline-none"
            aria-label="Previous team member"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextMember}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 z-10 p-2 sm:p-3 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all focus:outline-none"
            aria-label="Next team member"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Member Card */}
          <div
            key={currentIndex}
            className="carousel-animate bg-gradient-to-br from-zinc-800/40 to-zinc-900/60 border border-zinc-700/50 rounded-lg overflow-hidden hover:border-zinc-600/80 transition-all duration-300 shadow-2xl mx-auto max-w-5xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* Photo Section */}
              <div className="flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-950 p-8 sm:p-12 md:col-span-1">
                <div className="relative">
                  {/* Avatar Frame */}
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg bg-gradient-to-br from-white/5 to-white/10 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* LinkedIn Badge */}
                  <a
                    href={member.linkedin}
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
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-2">
                    <h3 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                      {member.name}
                    </h3>
                    <p className="text-blue-400 font-mono text-xs sm:text-sm uppercase tracking-widest">
                      {member.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-6">
                    <MapPin className="w-4 h-4" />
                    <span>{member.location}</span>
                  </div>
                </div>

                {/* About */}
                <div className="mb-8 min-h-[100px]">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
                    {member.bioHeader}
                  </h4>
                  <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
                    {member.bio}
                  </p>
                </div>

                {/* Expertise */}
                <div className="mb-8">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
                    Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((skill) => (
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
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-sm font-mono uppercase tracking-widest transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center justify-center gap-2 border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white px-6 py-3 rounded text-sm font-mono uppercase tracking-widest transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Dots Navigation */}
          <div className="flex justify-center gap-2 mt-6">
            {teamMembers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-blue-500 w-6' : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                aria-label={`Go to member ${idx + 1}`}
              />
            ))}
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
