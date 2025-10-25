import React, { useState, useEffect, useRef, forwardRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat } from "@google/genai";

// --- BUNDLED CODE ---

// types.ts
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

// services/geminiService.ts
let chat: Chat | null = null;
const SYSTEM_INSTRUCTION = `You are a friendly and helpful AI assistant for Rahul Poliyath's personal portfolio website. 
Your primary goal is to answer questions about Rahul, his skills, projects, and experience based on the information provided below.
However, you are also equipped to answer any general questions the user might have.
Be conversational, professional, and engaging. When answering about Rahul, keep your answers concise.
Here is some information about Rahul:
- Name: Rahul Poliyath
- Title: Full Stack Developer
- Summary: Enthusiastic and self-motivated Developer with over 2 years of professional experience at eClerx, supporting Xfinity clients. Passionate about technology since 2018. Skilled in both frontend and backend development, network systems, and problem-solving.
- Skills:
  - Frontend: HTML5, CSS3, JavaScript (ES6+), React.js, Vue.js, C++, Tailwind CSS, Bootstrap, Material UI
  - Backend: Node.js, Python, Java, FastAPI, PHP, Express.js, RESTful APIs, GraphQL, MySQL, DBMS, Linux
  - Tools: Git, Docker, VS Code, Visual Studio, Webpack, AWS, RedHat5, Android, KaliLinux, Android Studio, Aide
- Experience:
  - eClerx Services Ltd (July 2023 - June 2025): Analyst - Technical Support Executive for Xfinity client.
- Projects:
  - College Web App: A real-time platform for students and faculty to share updates.
  - Real-time Chat App: WebSocket-based app using Socket.io, React, Node.js.
  - Portfolio Dashboard, Task Management System, Weather Forecast App.
- Education: Bachelor of Computer Application, Tilak Maharashtra Vidyapeeth (2022).
- Contact: Ask the user to use the contact form on the website for professional inquiries.

If a question is about Rahul and you don't know the answer from the provided context, clearly state that you don't have that specific information about him. Do not invent information about Rahul. For all other questions, feel free to use your general knowledge.`;

const initializeChat = (): Chat => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
    });
};

const getChatResponse = async (userMessage: string): Promise<string> => {
    try {
        if (!chat) {
            chat = initializeChat();
        }

        const result = await chat.sendMessage({ message: userMessage });
        return result.text;
    } catch (error) {
        console.error("Gemini API error:", error);
        chat = null; // Reset chat on error
        return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
};

// hooks/useTheme.ts
const useTheme = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme) {
                return storedTheme as 'light' | 'dark';
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return { theme, toggleTheme };
};

// hooks/useScrollSpy.ts
const useScrollSpy = (
  sectionRefs: React.RefObject<HTMLElement>[],
  options?: { offset?: number }
): string => {
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    const handleScroll = () => {
      const offset = options?.offset ?? 0;
      const currentScrollY = window.scrollY;

      let newActiveSection = '';

      sectionRefs.forEach((ref) => {
        const section = ref.current;
        if (section) {
          const sectionTop = section.offsetTop - offset;
          if (currentScrollY >= sectionTop) {
            newActiveSection = section.id;
          }
        }
      });
      
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
         const lastSection = sectionRefs[sectionRefs.length - 1].current;
         if (lastSection) {
            newActiveSection = lastSection.id;
         }
      }

      if (newActiveSection !== '' && activeSection !== newActiveSection) {
        setActiveSection(newActiveSection);
      } else if (currentScrollY < (sectionRefs[0].current?.offsetTop ?? 0) - offset) {
         setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionRefs, options, activeSection]);

  return activeSection;
};

// components/ResumeModal.tsx
const ResumeSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-light-primary dark:text-dark-primary border-b border-light-border dark:border-dark-border pb-2 mb-3">{title}</h3>
        {children}
    </div>
);

const ExperienceItem: React.FC<{ title: string; company: string; period: string; description: string; }> = ({ title, company, period, description }) => (
    <div className="mb-4">
        <div className="flex justify-between items-baseline flex-wrap">
            <h4 className="font-bold text-light-text dark:text-dark-text">{title}</h4>
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{period}</span>
        </div>
        <p className="text-light-primary dark:text-dark-primary font-semibold">{company}</p>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary m-0">{description}</p>
    </div>
);

const ResumeModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    const handleDownload = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
            <div id="printable-resume" className="bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text w-full max-w-4xl h-full max-h-[90vh] rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-light-border dark:border-dark-border print:hidden">
                    <h2 className="text-lg font-bold">Rahul Poliyath - Resume</h2>
                    <div>
                        <button onClick={handleDownload} className="mr-4 text-light-primary dark:text-dark-primary"><i className="fas fa-print"></i></button>
                        <button onClick={onClose} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><i className="fas fa-times"></i></button>
                    </div>
                </div>
                <div className="p-8 overflow-y-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-extrabold mb-1">RAHUL POLIYATH</h1>
                        <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">Full Stack Developer</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">rahul.poliyath@email.com</p>
                    </div>
                    <ResumeSection title="Professional Summary">
                        <p className="text-light-text-secondary dark:text-dark-text-secondary">
                            Enthusiastic and self-motivated Developer with over 2 years of professional experience at eClerx, supporting Xfinity clients. Passionate about technology and programming since 2018. Skilled in both frontend and backend development, network systems, and problem-solving. Known for combining analytical thinking with creativity to build efficient, user-friendly, and scalable software solutions.
                        </p>
                    </ResumeSection>
                    <ResumeSection title="Technical Skills">
                        <p><strong>Frontend:</strong> HTML5, CSS3, JavaScript (ES6+), React.js, Vue.js, C++, Tailwind CSS, Bootstrap, Material UI</p>
                        <p><strong>Backend:</strong> Node.js, Python, Java, FastAPI, PHP, Express.js, RESTful APIs, GraphQL, MySQL , DMBS, Linux</p>
                        <p><strong>Tools:</strong> Git, Docker, VS Code, Visual Studio, Webpack, AWS, RedHat5, Android, KaliLinux, Android Studio, Aide</p>
                    </ResumeSection>
                     <ResumeSection title="Work Experience">
                        <ExperienceItem title="Analyst - Technical Support Executive" company="eClerx Services Ltd (for Xfinity)" period="July 2023 - June 2025" description="Provided advanced technical solutions and remote troubleshooting for Xfinity clients, utilizing remote desktop tools, network analysis software, and diagnostic utilities to resolve problems effectively." />
                        <ExperienceItem title="Full Stack Developer (Freelance/Personal)" company="Self-Employed" period="2018 - Present" description="Developed multiple full-stack projects, including a real-time college web application and a WebSocket-based chat application, honing skills in both frontend and backend technologies." />
                    </ResumeSection>
                    <ResumeSection title="Education">
                        <div className="flex justify-between items-baseline">
                             <h4 className="font-bold text-light-text dark:text-dark-text">Bachelor of Computer Application</h4>
                             <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">2022</span>
                        </div>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary">Tilak Maharashtra Vidyapeeth</p>
                    </ResumeSection>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-resume, #printable-resume * {
                        visibility: visible;
                    }
                    #printable-resume {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        max-height: none;
                        border: none;
                        box-shadow: none;
                        border-radius: 0;
                        color: #000 !important;
                        background: #fff !important;
                    }
                    #printable-resume .dark\\\\:text-dark-text { color: #000 !important; }
                    #printable-resume .dark\\\\:text-dark-text-secondary { color: #333 !important; }
                    #printable-resume .dark\\\\:text-dark-primary { color: #21808D !important; }
                    #printable-resume .dark\\\\:border-dark-border { border-color: #ccc !important; }
                }
            `}</style>
        </div>
    );
};

// components/Header.tsx
const navLinks = [
    { id: 'home', title: 'Home' },
    { id: 'about', title: 'About' },
    { id: 'skills', title: 'Skills' },
    { id: 'projects', title: 'Projects' },
    { id: 'resume', title: 'Resume' },
    { id: 'contact', title: 'Contact' },
];

const Header: React.FC<{ activeSection: string; onNavClick: (sectionId: string) => void; theme: 'light' | 'dark'; toggleTheme: () => void; }> = ({ activeSection, onNavClick, theme, toggleTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLinkClick = (id: string) => {
        onNavClick(id);
        setIsMenuOpen(false);
    };

    return (
// FIX: Replaced single quotes with backticks for template literal class name.
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-lg border-b border-light-border dark:border-dark-border' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="text-2xl font-bold bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 text-transparent bg-clip-text">
                        RP
                    </div>
                    <nav className="hidden md:flex items-center space-x-2">
                        {navLinks.map((link) => (
                            <a
                                key={link.id}
// FIX: Replaced single quotes with backticks for template literal href.
                                href={`#${link.id}`}
                                onClick={(e) => { e.preventDefault(); handleLinkClick(link.id); }}
// FIX: Replaced single quotes with backticks for template literal class name.
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === link.id ? 'text-light-primary dark:text-dark-primary bg-light-secondary-bg dark:bg-dark-secondary-bg' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary'}`}
                            >
                                {link.title}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-4">
                        <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:bg-light-secondary-bg dark:hover:bg-dark-secondary-bg transition-transform duration-300 transform hover:rotate-180" aria-label="Toggle theme">
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
                            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
                        </button>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2" aria-label="Toggle menu">
                                <div className="space-y-1.5">
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
                                    <span className={`block w-6 h-0.5 bg-light-text dark:bg-dark-text transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
                                    <span className={`block w-6 h-0.5 bg-light-text dark:bg-dark-text transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
                                    <span className={`block w-6 h-0.5 bg-light-text dark:bg-dark-text transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
            <div className={`md:hidden absolute top-20 left-0 w-full bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border transition-transform duration-300 ease-in-out ${isMenuOpen ? 'transform translate-y-0' : 'transform -translate-y-[120%]'}`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navLinks.map((link) => (
                        <a
                            key={link.id}
// FIX: Replaced single quotes with backticks for template literal href.
                            href={`#${link.id}`}
                            onClick={(e) => { e.preventDefault(); handleLinkClick(link.id); }}
// FIX: Replaced single quotes with backticks for template literal class name.
                            className={`block px-3 py-2 rounded-md text-base font-medium ${activeSection === link.id ? 'text-light-primary dark:text-dark-primary bg-light-secondary-bg dark:bg-dark-secondary-bg' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary'}`}
                        >
                            {link.title}
                        </a>
                    ))}
                </div>
            </div>
        </header>
    );
};

// components/Hero.tsx
const typingTexts = ['Full Stack Developer', 'AI Enthusiast', 'Problem Solver'];
const Hero = forwardRef<HTMLElement, { onContactClick: () => void; }>(({ onContactClick }, ref) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);
    const [isResumeOpen, setIsResumeOpen] = useState(false);

    useEffect(() => {
        const handleType = () => {
            const i = loopNum % typingTexts.length;
            const fullText = typingTexts[i];
            setText(isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1));
            setTypingSpeed(isDeleting ? 75 : 150);
            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };
        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, typingSpeed, loopNum]);

    return (
        <section id="home" ref={ref} className="min-h-screen flex items-center justify-center relative overflow-hidden text-center px-4">
            <div className="absolute inset-0 z-0">
                {[...Array(5)].map((_, i) => (
// FIX: Replaced single quotes with backticks for template literal style values.
                    <div key={i} className="absolute w-1 h-1 bg-light-primary dark:bg-dark-primary rounded-full animate-float" style={{
                        animationDelay: `${i}s`,
                        top: `${Math.random() * 80 + 10}%`,
                        left: `${Math.random() * 80 + 10}%`,
                    }} />
                ))}
            </div>
            <div className="z-10">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 text-transparent bg-clip-text animate-glow dark:animate-dark-glow">
                    RAHUL POLIYATH
                </h1>
                <p className="text-xl md:text-2xl mb-6 text-light-text dark:text-dark-text">
                    <span>{text}</span>
                    <span className="animate-blink text-light-primary dark:text-dark-primary">|</span>
                </p>
                <p className="max-w-2xl mx-auto mb-8 text-light-text-secondary dark:text-dark-text-secondary">
                    Crafting innovative web solutions with cutting-edge technologies and a passion for seamless user experiences.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={() => setIsResumeOpen(true)} className="w-full sm:w-auto px-8 py-3 bg-light-primary dark:bg-dark-primary text-white font-semibold rounded-lg shadow-lg hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover transform hover:-translate-y-1 transition-all duration-300">
                        View Resume
                    </button>
                    <button onClick={onContactClick} className="w-full sm:w-auto px-8 py-3 border-2 border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary font-semibold rounded-lg shadow-lg hover:bg-light-primary dark:hover:bg-dark-primary hover:text-white dark:hover:text-dark-bg transform hover:-translate-y-1 transition-all duration-300">
                        Contact Me
                    </button>
                </div>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <div className="w-2 h-2 border-2 border-light-primary dark:border-dark-primary rounded-full animate-bounce"></div>
            </div>
            <ResumeModal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />
        </section>
    );
});

// components/About.tsx
const HighlightCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4 p-6 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border transform hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-xl">
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
        <i className={`fas ${icon} text-2xl text-light-primary dark:text-dark-primary w-8 pt-1`}></i>
        <div>
            <h4 className="font-bold text-lg mb-1 text-light-text dark:text-dark-text">{title}</h4>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary m-0">{description}</p>
        </div>
    </div>
);
const About = forwardRef<HTMLElement>((props, ref) => (
    <section id="about" ref={ref} className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
                About Me
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 rounded-full"></span>
            </h2>
            <div className="grid md:grid-cols-5 gap-12 items-center">
                <div className="md:col-span-2 flex justify-center">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-light-secondary-bg to-blue-100 dark:from-dark-secondary-bg dark:to-cyan-900 flex items-center justify-center border-4 border-light-primary/50 dark:border-dark-primary/50 shadow-lg">
                        <i className="fas fa-user text-6xl md:text-8xl text-light-primary dark:text-dark-primary"></i>
                    </div>
                </div>
                <div className="md:col-span-3">
                    <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mb-8">
                        Passionate full stack developer with expertise in building scalable web applications. Specializing in modern JavaScript frameworks, Python, and cloud technologies. Dedicated to creating seamless user experiences and robust backend systems.
                    </p>
                    <div className="grid sm:grid-cols-1 gap-6">
                        <HighlightCard icon="fa-code" title="Clean Code" description="Writing maintainable, scalable, and efficient code is my top priority." />
                        <HighlightCard icon="fa-rocket" title="Performance" description="Building optimized, fast-loading applications for a superior user experience." />
                        <HighlightCard icon="fa-mobile-alt" title="Responsive" description="Mobile-first, cross-platform design to ensure a great look on all devices." />
                    </div>
                </div>
            </div>
        </div>
    </section>
));

// components/Skills.tsx
const SkillCategory: React.FC<{ icon: string; title: string; skills: string[] }> = ({ icon, title, skills }) => (
    <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg border border-light-border dark:border-dark-border transform hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-xl">
        <h3 className="flex items-center gap-4 text-xl font-bold mb-6 text-light-text dark:text-dark-text">
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
            <i className={`fas ${icon} text-2xl text-light-primary dark:text-dark-primary`}></i>
            {title}
        </h3>
        <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
                <span key={skill} className="bg-light-secondary-bg dark:bg-dark-secondary-bg text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium px-4 py-2 rounded-full hover:text-light-primary dark:hover:text-dark-primary transition-colors">
                    {skill}
                </span>
            ))}
        </div>
    </div>
);
const Skills = forwardRef<HTMLElement>((props, ref) => {
    const skillsData = {
        frontend: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React.js', 'Vue.js', 'C++', 'Tailwind CSS', 'Bootstrap', 'Material UI'],
        backend: ['Node.js', 'Python', 'Java', 'FastAPI', 'PHP', 'Express.js', 'RESTful APIs', 'GraphQL', 'MySQL', 'DBMS', 'Linux'],
        tools: ['Git & GitHub', 'Docker', 'VS Code', 'Visual Studio', 'Webpack', 'AWS', 'RedHat5', 'Android', 'KaliLinux', 'Android Studio', 'Aide'],
    };
    return (
        <section id="skills" ref={ref} className="py-20 lg:py-32 bg-light-secondary-bg/50 dark:bg-dark-secondary-bg/50">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
                    Skills & Technologies
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 rounded-full"></span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <SkillCategory icon="fa-desktop" title="Frontend" skills={skillsData.frontend} />
                    <SkillCategory icon="fa-server" title="Backend" skills={skillsData.backend} />
                    <SkillCategory icon="fa-tools" title="Tools & Technologies" skills={skillsData.tools} />
                </div>
            </div>
        </section>
    );
});

// components/Projects.tsx
const projectsData = [
    { icon: 'fa-chart-bar', title: 'Portfolio Dashboard', description: 'Analytics dashboard for tracking project metrics and performance.', tech: ['Vue.js', 'Chart.js', 'Express', 'PostgreSQL'] },
    { icon: 'fa-tasks', title: 'Task Management System', description: 'Collaborative project management tool with real-time updates.', tech: ['React', 'Firebase', 'Material-UI'] },
    { icon: 'fa-cloud-sun', title: 'Weather Forecast App', description: 'Interactive weather application with location-based forecasts.', tech: ['JavaScript', 'Weather API', 'CSS3'] },
];
const ProjectCard: React.FC<typeof projectsData[0]> = ({ icon, title, description, tech }) => (
    <div className="bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-xl group">
        <div className="h-48 bg-gradient-to-br from-light-secondary-bg to-blue-100 dark:from-dark-secondary-bg dark:to-cyan-900 flex items-center justify-center relative">
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
            <i className={`fas ${icon} text-6xl text-light-primary dark:text-dark-primary transition-transform duration-300 group-hover:scale-110`}></i>
        </div>
        <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-light-text dark:text-dark-text">{title}</h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4 h-16">{description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {tech.map(t => (
                    <span key={t} className="text-xs font-semibold bg-light-secondary-bg dark:bg-dark-secondary-bg text-light-primary dark:text-dark-primary px-3 py-1 rounded-full">
                        {t}
                    </span>
                ))}
            </div>
        </div>
    </div>
);
const Projects = forwardRef<HTMLElement>((props, ref) => (
    <section id="projects" ref={ref} className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
                Featured Projects
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 rounded-full"></span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projectsData.map(p => <ProjectCard key={p.title} {...p} />)}
            </div>
        </div>
    </section>
));

// components/Resume.tsx
const Resume = forwardRef<HTMLElement>((props, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <section id="resume" ref={ref} className="py-20 lg:py-32 bg-light-secondary-bg/50 dark:bg-dark-secondary-bg/50">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
                    Resume
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 rounded-full"></span>
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                     <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-light-primary dark:bg-dark-primary text-white font-semibold rounded-lg shadow-lg hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover transform hover:-translate-y-1 transition-all duration-300 text-lg">
                        <i className="fas fa-eye"></i>
                        View Resume Online
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border-2 border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary font-semibold rounded-lg shadow-lg hover:bg-light-primary dark:hover:bg-dark-primary hover:text-white dark:hover:text-dark-bg transform hover:-translate-y-1 transition-all duration-300 text-lg">
                        <i className="fas fa-download"></i>
                        Download Resume
                    </button>
                </div>
            </div>
            <ResumeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
    );
});

// components/Contact.tsx
const SocialLink: React.FC<{ href: string; icon: string }> = ({ href, icon }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-primary dark:hover:bg-dark-primary hover:text-white dark:hover:text-dark-bg transform hover:-translate-y-1 transition-all duration-300">
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
        <i className={`fab ${icon} text-xl`}></i>
    </a>
);
const Contact = forwardRef<HTMLElement>((props, ref) => {
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus('sending');
        setTimeout(() => {
            setStatus('sent');
            (e.target as HTMLFormElement).reset();
            setTimeout(() => setStatus('idle'), 3000);
        }, 2000);
    };
    const buttonText = {
        idle: <><i className="fas fa-paper-plane mr-2"></i>Send Message</>,
        sending: <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Sending...</>,
        sent: <><i className="fas fa-check mr-2"></i>Message Sent!</>,
    };
    return (
        <section id="contact" ref={ref} className="py-20 lg:py-32">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
                    Get In Touch
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 rounded-full"></span>
                </h2>
                <div className="grid lg:grid-cols-5 gap-12">
                    <div className="lg:col-span-3 bg-light-surface dark:bg-dark-surface p-8 rounded-lg border border-light-border dark:border-dark-border shadow-lg">
                        <form onSubmit={handleSubmit}>
                            <div className="grid sm:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                                    <input type="text" id="name" required className="w-full p-3 bg-light-secondary-bg/50 dark:bg-dark-secondary-bg/50 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                                    <input type="email" id="email" required className="w-full p-3 bg-light-secondary-bg/50 dark:bg-dark-secondary-bg/50 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none" />
                                </div>
                            </div>
                            <div className="mb-6">
                                <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                                <input type="text" id="subject" required className="w-full p-3 bg-light-secondary-bg/50 dark:bg-dark-secondary-bg/50 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none" />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                                <textarea id="message" rows={5} required className="w-full p-3 bg-light-secondary-bg/50 dark:bg-dark-secondary-bg/50 border border-light-border dark:border-dark-border rounded-lg resize-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"></textarea>
                            </div>
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
                            <button type="submit" disabled={status === 'sending'} className={`w-full p-4 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${status === 'sent' ? 'bg-green-500' : 'bg-light-primary dark:bg-dark-primary hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover'} text-white`}>
                                {buttonText[status]}
                            </button>
                        </form>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="flex items-start gap-4 mb-8">
                            <i className="fas fa-envelope text-2xl text-light-primary dark:text-dark-primary mt-1"></i>
                            <div>
                                <h4 className="font-bold text-lg text-light-text dark:text-dark-text">Email</h4>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary">rahul.poliyath@email.com</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-light-text dark:text-dark-text mb-4">Connect With Me</h4>
                            <div className="flex flex-wrap gap-4">
                                <SocialLink href="https://github.com/rahulpoliyath" icon="fa-github" />
                                <SocialLink href="https://linkedin.com/in/rahulpoliyath" icon="fa-linkedin" />
                                <SocialLink href="https://t.me/realanonymoususer" icon="fa-telegram" />
                                <SocialLink href="https://wa.me/rahulpoliyath" icon="fa-whatsapp" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});

// components/Footer.tsx
const Footer: React.FC<{ onNavClick: (sectionId: string) => void; }> = ({ onNavClick }) => {
    return (
        <footer className="bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-light-primary to-blue-400 dark:from-dark-primary dark:to-cyan-400 text-transparent bg-clip-text mb-2">RAHUL POLIYATH</h3>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Full Stack Developer</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-light-text dark:text-dark-text">Quick Links</h4>
                        <ul className="space-y-2">
                            {['home', 'about', 'projects', 'contact'].map(id => (
                                <li key={id}>
{/* FIX: Replaced single quotes with backticks for template literal href. */}
                                    <a href={`#${id}`} onClick={(e) => { e.preventDefault(); onNavClick(id); }} className="capitalize text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors">
                                        {id}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-light-text dark:text-dark-text">Follow Me</h4>
                        <div className="flex justify-center md:justify-start gap-4">
                             <a href="https://github.com/rahulpoliyath" target="_blank" rel="noopener noreferrer" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors text-2xl"><i className="fab fa-github"></i></a>
                             <a href="https://linkedin.com/in/rahulpoliyath" target="_blank" rel="noopener noreferrer" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors text-2xl"><i className="fab fa-linkedin"></i></a>
                             <a href="https://t.me/realanonymoususer" target="_blank" rel="noopener noreferrer" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors text-2xl"><i className="fab fa-telegram"></i></a>
                        </div>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <p>&copy; {new Date().getFullYear()} Rahul Poliyath. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// components/Chatbot.tsx
const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hi! I'm Rahul's AI assistant. Ask me anything about his skills or projects!", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await getChatResponse(input);
            const botMessage: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = { id: (Date.now() + 1).toString(), text: "Oops! Something went wrong. Please try again.", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-light-primary dark:bg-dark-primary text-white rounded-full shadow-2xl flex items-center justify-center text-3xl z-50 transform hover:scale-110 transition-transform duration-300"
                aria-label="Toggle Chatbot"
            >
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
                <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'}`}></i>
            </button>
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
            <div className={`fixed bottom-24 right-6 w-[calc(100vw-3rem)] max-w-sm h-[70vh] max-h-[600px] bg-light-surface dark:bg-dark-surface shadow-2xl rounded-lg border border-light-border dark:border-dark-border flex flex-col transition-all duration-300 ease-in-out z-50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <div className="p-4 border-b border-light-border dark:border-dark-border">
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text">AI Assistant</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Ask me about Rahul</p>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg) => (
// FIX: Replaced single quotes with backticks for template literal class name.
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-light-primary dark:bg-dark-primary flex items-center justify-center text-white flex-shrink-0"><i className="fas fa-robot"></i></div>}
{/* FIX: Replaced single quotes with backticks for template literal class name. */}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-light-primary dark:bg-dark-primary text-white rounded-br-lg' : 'bg-light-secondary-bg dark:bg-dark-secondary-bg text-light-text dark:text-dark-text rounded-bl-lg'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                             <div className="w-8 h-8 rounded-full bg-light-primary dark:bg-dark-primary flex items-center justify-center text-white flex-shrink-0"><i className="fas fa-robot"></i></div>
                            <div className="p-3 rounded-2xl bg-light-secondary-bg dark:bg-dark-secondary-bg rounded-bl-lg">
                                <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-light-text-secondary dark:bg-dark-text-secondary rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-light-text-secondary dark:bg-dark-text-secondary rounded-full animate-bounce delay-150"></span>
                                    <span className="w-2 h-2 bg-light-text-secondary dark:bg-dark-text-secondary rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-light-border dark:border-dark-border flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-3 bg-light-secondary-bg/50 dark:bg-dark-secondary-bg/50 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
                    />
                    <button type="submit" disabled={isLoading} className="w-12 h-12 bg-light-primary dark:bg-dark-primary text-white rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-50">
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </>
    );
};


// App.tsx
const App: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const sectionRefs = {
        home: useRef<HTMLElement>(null),
        about: useRef<HTMLElement>(null),
        skills: useRef<HTMLElement>(null),
        projects: useRef<HTMLElement>(null),
        resume: useRef<HTMLElement>(null),
        contact: useRef<HTMLElement>(null),
    };

    const sectionIds = Object.keys(sectionRefs);
    const activeSection = useScrollSpy(sectionIds.map(id => sectionRefs[id as keyof typeof sectionRefs]), { offset: 100 });

    const scrollToSection = (sectionId: string) => {
        const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
        if (ref.current) {
            const navHeight = 80;
            const elementPosition = ref.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navHeight;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={'antialiased font-sans text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg'}>
            <Header activeSection={activeSection} onNavClick={scrollToSection} theme={theme} toggleTheme={toggleTheme} />
            <main>
                <Hero ref={sectionRefs.home} onContactClick={() => scrollToSection('contact')} />
                <About ref={sectionRefs.about} />
                <Skills ref={sectionRefs.skills} />
                <Projects ref={sectionRefs.projects} />
                <Resume ref={sectionRefs.resume} />
                <Contact ref={sectionRefs.contact} />
            </main>
            <Footer onNavClick={scrollToSection} />
            <Chatbot />
            <div className="watermark fixed bottom-5 right-5 font-mono text-xs text-light-text-secondary dark:text-dark-text-secondary opacity-50 z-50 pointer-events-none uppercase tracking-widest animate-glow dark:animate-dark-glow">
                RAHUL POLIYATH
            </div>
        </div>
    );
};

// --- MOUNTING LOGIC ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);