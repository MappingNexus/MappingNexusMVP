import React, { useState } from 'react';
import { Linkedin, Mail, MapPin, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

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
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSlide = (newDirection: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(newDirection);

    setTimeout(() => {
      if (newDirection === 'right') {
        setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
      }
      setIsAnimating(false);
    }, 400); // Wait for exit animation
  };

  const member = teamMembers[currentIndex];

  return (
    <section className="w-full bg-[#080808] py-24 sm:py-32 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Style for transitions - simple vanilla CSS approach since we're avoiding extra libs */}
        <style>{`
          .fade-enter {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          .fade-enter-active {
            opacity: 1;
            transform: translateY(0) scale(1);
            transition: opacity 400ms ease-out, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
          }
          .fade-exit {
            opacity: 1;
            transform: scale(1);
          }
          .fade-exit-active {
            opacity: 0;
            transform: scale(0.98);
            transition: opacity 400ms ease-in, transform 400ms ease-in;
          }
        `}</style>

        {/* Section Header */}
        <div className="flex flex-col items-center mb-16 sm:mb-24 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-blue-500 mb-4 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
            Architects of Intelligence
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
            Meet The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Team</span>
          </h2>
          <div className="w-px h-16 bg-gradient-to-b from-zinc-500 to-transparent"></div>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={() => handleSlide('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-12 z-20 p-4 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:scale-110 transition-all backdrop-blur-md group focus:outline-none"
            aria-label="Previous team member"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleSlide('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-12 z-20 p-4 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:scale-110 transition-all backdrop-blur-md group focus:outline-none"
            aria-label="Next team member"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Member Card */}
          <div
            className={`transition-all duration-500 ease-in-out transform ${isAnimating ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
              }`}
          >
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5 mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[500px]">

                {/* Visual Side */}
                <div className="lg:col-span-5 relative bg-gradient-to-b from-zinc-800/50 to-zinc-950/50 flex flex-col justify-between p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-white/5">
                  {/* Decorative Quote */}
                  <Quote className="absolute top-8 left-8 w-12 h-12 text-white/5 fill-current" />

                  <div className="flex-grow flex items-center justify-center py-8">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[60px] group-hover:bg-blue-500/30 transition-all duration-700"></div>
                      <div className="w-56 h-56 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-2 relative z-10 backdrop-blur-sm transform group-hover:scale-105 transition-transform duration-500">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-xl bg-zinc-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 relative z-10">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-blue-400 hover:text-blue-300 transition-all hover:scale-110"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a
                      href={`mailto:${member.email}`}
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all hover:scale-110"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Content Side */}
                <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-zinc-900/20">
                  <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                        {member.name}
                      </h3>
                      <div className="h-px flex-grow bg-zinc-800"></div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-blue-400 font-mono text-sm uppercase tracking-widest border border-blue-900/30 bg-blue-900/10 px-3 py-1 rounded w-fit">
                        {member.role}
                      </p>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest font-mono">
                        <MapPin className="w-3 h-3" />
                        <span>{member.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                      <h4 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                        {member.bioHeader}
                      </h4>
                    </div>
                    <p className="text-zinc-300 text-lg leading-relaxed font-light pl-4">
                      {member.bio}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-4 pl-4">
                      Core Competencies
                    </h4>
                    <div className="flex flex-wrap gap-2 pl-4">
                      {member.expertise.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 rounded-md hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-colors cursor-default"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Pagination Stripes */}
            <div className="flex justify-center gap-3 mt-12">
              {teamMembers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 'right' : 'left');
                    setCurrentIndex(idx);
                  }}
                  className={`h-1 rounded-full transition-all duration-500 ${idx === currentIndex
                      ? 'bg-blue-500 w-12'
                      : 'bg-zinc-800 w-4 hover:w-6 hover:bg-zinc-700'
                    }`}
                  aria-label={`Go to member ${idx + 1}`}
                />
              ))}
            </div>

          </div>
        </div>

        {/* Stats Section with Glass Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-8 fill-mode-forwards delay-500 border-t border-zinc-800/50 pt-12">
          {[
            { number: '250+', label: 'Employees Managed', desc: 'Optimized via MappingNexus' },
            { number: '99.9%', label: 'System Uptime', desc: 'Enterprise-grade reliability' },
            { number: '24/7', label: 'Global Support', desc: 'Dedicated engineering team' }
          ].map((stat, idx) => (
            <div key={idx} className="group p-6 rounded-xl bg-zinc-900/20 border border-zinc-800/50 hover:bg-zinc-900/40 hover:border-zinc-700 transition-all text-center">
              <div className="text-3xl font-light text-white mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">
                {stat.number}
              </div>
              <div className="text-blue-500 text-xs font-mono uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-zinc-600 text-xs">{stat.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
